import { Lifetime } from "awilix"
import {
    FindConfig,
    OrderService as MedusaOrderService, User, Selector
} from "@medusajs/medusa"
import { isDefined, MedusaError } from "@medusajs/utils"

import { QuerySelector } from "@medusajs/medusa/dist/types/common"

import { Cart } from "@medusajs/medusa/dist/models"
import { Order } from "../models/order"
import { isString } from "@medusajs/medusa/dist/utils"
export const ORDER_CART_ALREADY_EXISTS_ERROR = "Order from cart already exists"
import SalesChannelFeatureFlag from "@medusajs/medusa/dist/loaders/feature-flags/sales-channels"
import NewFulfillmentService from "./new-fulfillment"


class OrderService extends MedusaOrderService {
    static LIFE_TIME = Lifetime.SCOPED
    private newFulfillmentService: NewFulfillmentService
    protected readonly loggedInAdmin_: User | null
    protected readonly storeFrontStoreId_: string | null
    constructor(container, options) {
        // @ts-expect-error prefer-rest-params
        super(...arguments)

        try {
            if (Object.hasOwn(container, 'loggedInUser')) {
                this.loggedInAdmin_ = container.loggedInUser
                // console.log("==loggedInAdmin_==" + this.loggedInAdmin_?.store_id + "==")
            }

            else if (Object.hasOwn(container, 'store_id')) {
                this.storeFrontStoreId_ = container.store_id
                // console.log("==storeFrontStoreId_==" + this.storeFrontStoreId_ + "==")
            }
            this.newFulfillmentService = container.newFulfillmentService
        } catch (e) {
            // avoid errors when backend first runs
            console.error(e)
        }
    }

    async list(
        selector: Selector<Order>,
        config: FindConfig<Order> = {
            skip: 0,
            take: 50,
            order: { created_at: "DESC" },
        }
    ): Promise<Order[]> {
        if (!selector.store_id && this.storeFrontStoreId_) {
            selector.store_id = this.storeFrontStoreId_
        } else if (!selector.store_id && this.loggedInAdmin_ && this.loggedInAdmin_?.store_id) {
            selector.store_id = this.loggedInAdmin_.store_id
        }

        config.select?.push('store_id')

        config.relations?.push('store')

        return await super.list(selector, config)
    }

    async listAndCount(selector: QuerySelector<Order>,
        config: FindConfig<Order> = {
            skip: 0,
            take: 50,
            order: { created_at: "DESC" },
        }
    ): Promise<[Order[], number]> {

        if (!selector.store_id && this.storeFrontStoreId_) {
            selector.store_id = this.storeFrontStoreId_
        } else if (!selector.store_id && this.loggedInAdmin_ && this.loggedInAdmin_?.store_id) {
            selector.store_id = this.loggedInAdmin_.store_id
        }

        config.select?.push('store_id')

        config.relations?.push('store')

        return await super.listAndCount(selector, config)
    }

    async createFromCart(cartOrId: string | Cart): Promise<Order | never> {
        return await this.atomicPhase_(async (manager) => {
            const cartServiceTx = this.cartService_.withTransaction(manager)
            const storeID = this.storeFrontStoreId_ ? this.storeFrontStoreId_ : this.loggedInAdmin_?.store_id

            const exists = !!(await this.retrieveByCartId(
                isString(cartOrId) ? cartOrId : cartOrId?.id,
                {
                    select: ["id"],
                }
            ).catch(() => void 0))

            if (exists) {
                throw new MedusaError(
                    MedusaError.Types.DUPLICATE_ERROR,
                    ORDER_CART_ALREADY_EXISTS_ERROR
                )
            }

            const cart = isString(cartOrId)
                ? await cartServiceTx.retrieveWithTotals(cartOrId, {
                    relations: ["region", "payment", "items"],
                })
                : cartOrId

            if (cart.items.length === 0) {
                throw new MedusaError(
                    MedusaError.Types.INVALID_DATA,
                    "Cannot create order from empty cart"
                )
            }

            const { payment, region, total } = cart

            // Would be the case if a discount code is applied that covers the item
            // total
            if (total !== 0) {
                if (!payment) {
                    throw new MedusaError(
                        MedusaError.Types.INVALID_ARGUMENT,
                        "Cart does not contain a payment method"
                    )
                }

                const paymentStatus = await this.paymentProviderService_
                    .withTransaction(manager)
                    .getStatus(payment)

                if (paymentStatus !== "authorized") {
                    throw new MedusaError(
                        MedusaError.Types.INVALID_ARGUMENT,
                        "Payment method is not authorized"
                    )
                }
            }

            const orderRepo = manager.withRepository(this.orderRepository_)

            // TODO: Due to cascade insert we have to remove the tax_lines that have been added by the cart decorate totals.
            // Is the cascade insert really used? Also, is it really necessary to pass the entire entities when creating or updating?
            // We normally should only pass what is needed?
            const shippingMethods = cart.shipping_methods.map((method) => {
                (method.tax_lines as any) = undefined
                return method
            })

            const toCreate = {
                payment_status: "awaiting",
                discounts: cart.discounts,
                gift_cards: cart.gift_cards,
                shipping_methods: shippingMethods,
                shipping_address_id: cart.shipping_address_id,
                billing_address_id: cart.billing_address_id,
                region_id: cart.region_id,
                email: cart.email,
                customer_id: cart.customer_id,
                cart_id: cart.id,
                currency_code: region.currency_code,
                metadata: cart.metadata || {},
                store_id: storeID
            } as Partial<Order>

            if (
                cart.sales_channel_id &&
                this.featureFlagRouter_.isFeatureEnabled(SalesChannelFeatureFlag.key)
            ) {
                toCreate.sales_channel_id = cart.sales_channel_id
            }

            if (cart.type === "draft_order") {
                const draft = await this.draftOrderService_
                    .withTransaction(manager)
                    .retrieveByCartId(cart.id)

                toCreate.draft_order_id = draft.id
                toCreate.no_notification = draft.no_notification_order
            }

            const rawOrder = orderRepo.create(toCreate)
            const order = await orderRepo.save(rawOrder)

            if (total !== 0 && payment) {
                await this.paymentProviderService_
                    .withTransaction(manager)
                    .updatePayment(payment.id, {
                        order_id: order.id,
                    })
            }

            if (!isDefined(cart.subtotal) || !isDefined(cart.discount_total)) {
                throw new MedusaError(
                    MedusaError.Types.UNEXPECTED_STATE,
                    "Unable to compute gift cardable amount during order creation from cart. The cart is missing the subtotal and/or discount_total"
                )
            }

            const giftCardableAmount =
                (cart.region?.gift_cards_taxable
                    ? cart.subtotal! - cart.discount_total!
                    : cart.total! + cart.gift_card_total!) || 0 // we re add the gift card total to compensate the fact that the decorate total already removed this amount from the total

            let giftCardableAmountBalance = giftCardableAmount
            const giftCardService = this.giftCardService_.withTransaction(manager)

            for (const giftCard of cart.gift_cards) {
                const newGiftCardBalance = Math.max(
                    0,
                    giftCard.balance - giftCardableAmountBalance
                )
                const giftCardBalanceUsed = giftCard.balance - newGiftCardBalance

                await giftCardService.update(giftCard.id, {
                    balance: newGiftCardBalance,
                    is_disabled: newGiftCardBalance === 0,
                })

                await giftCardService.createTransaction({
                    gift_card_id: giftCard.id,
                    order_id: order.id,
                    amount: giftCardBalanceUsed,
                    is_taxable: !!giftCard.tax_rate,
                    tax_rate: giftCard.tax_rate,
                })

                giftCardableAmountBalance =
                    giftCardableAmountBalance - giftCardBalanceUsed
            }

            const shippingOptionServiceTx =
                this.shippingOptionService_.withTransaction(manager)
            const lineItemServiceTx = this.lineItemService_.withTransaction(manager)
            const variantServiceTx = this.productVariantInventoryService_.withTransaction(manager)

            await Promise.all(
                [
                    cart.items.map((lineItem): unknown[] => {
                        const toReturn: unknown[] = [
                            lineItemServiceTx.update(lineItem.id, { order_id: order.id }),
                        ]

                        if (lineItem.is_giftcard) {
                            toReturn.push(
                                this.createGiftCardsFromLineItem_(order, lineItem, manager)
                            )
                        }

                        return toReturn
                    }),
                    cart.shipping_methods.map(async (method) => {
                        // TODO: Due to cascade insert we have to remove the tax_lines that have been added by the cart decorate totals.
                        // Is the cascade insert really used? Also, is it really necessary to pass the entire entities when creating or updating?
                        // We normally should only pass what is needed?
                        (method.tax_lines as any) = undefined
                        return shippingOptionServiceTx.updateShippingMethod(method.id, {
                            order_id: order.id,
                        })
                    }),
                ].flat(Infinity)
            )

            await this.eventBus_
                .withTransaction(manager)
                .emit(OrderService.Events.PLACED, {
                    id: order.id,
                    no_notification: order.no_notification,
                })

            await cartServiceTx.update(cart.id, { completed_at: new Date() })

            return order
        })
    }

}

export default OrderService