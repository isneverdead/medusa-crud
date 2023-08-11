import { ConfigModule, TransactionBaseService } from "@medusajs/medusa"
import NewFulfillmentRepository from "../repositories/new-fulfillment"
import ProductRepository from "../repositories/new-fulfillment"
import { NewFulfillment } from "../models/new-fulfillment"
import { EntityManager, IsNull, Not } from "typeorm"
import { UpdateNewFulfillmentInput, CreateNewFulfillmentInput } from "../types/new-fulfilment"


import { Product } from "@medusajs/medusa/dist/models"

type InjectedDependencies = {
    manager: EntityManager;
    newFulfillmentRepository: typeof NewFulfillmentRepository;
    productRepository: typeof ProductRepository;
};

export type RetrieveNewFulfillment = {
    clinicProduct?: Product
    vendorProduct?: Product

} & NewFulfillment

class NewFulfillmentService extends TransactionBaseService {
    protected newFulfillmentRepository_: typeof NewFulfillmentRepository
    protected productRepository_: typeof ProductRepository
    protected readonly configModule_: ConfigModule


    constructor({ newFulfillmentRepository, productRepository }: InjectedDependencies) {
        super(arguments[0])

        this.newFulfillmentRepository_ = newFulfillmentRepository
        this.productRepository_ = productRepository
    }

    async retrieve(id: string): Promise<RetrieveNewFulfillment | undefined> {
        try {
            const newFulfillmentRepo = this.activeManager_.withRepository(
                this.newFulfillmentRepository_
            )
            const productRepo = this.activeManager_.withRepository(
                this.productRepository_
            )

            const fulfillmentData = await newFulfillmentRepo.findOne({
                where: { id: id },
            })

            let newFulfillmentData: any = fulfillmentData

            if (fulfillmentData.clinic_product_id) {
                const clinicProduct = await productRepo.findOne({
                    where: {
                        id: fulfillmentData.clinic_product_id,
                    },
                })

                newFulfillmentData.clinicProduct = clinicProduct
            }
            if (fulfillmentData.vendor_product_id) {
                const vendorProduct = await productRepo.findOne({
                    where: {
                        id: fulfillmentData.vendor_product_id,
                    },
                })

                newFulfillmentData.vendorProduct = vendorProduct
            }



            return fulfillmentData
        } catch (error) {
            console.log(error)
        }

    }

    async update(
        data: UpdateNewFulfillmentInput
    ): Promise<NewFulfillment> {
        return await this.atomicPhase_(
            async (transactionManager: EntityManager) => {
                const newFulfillmentRepository =
                    transactionManager.withRepository(
                        this.newFulfillmentRepository_
                    )

                const currentData = await this.retrieve(data.id)

                for (const [key, value] of Object.entries(data)) {
                    currentData[key] = value
                }

                await newFulfillmentRepository.save(currentData)
                return await this.retrieve(currentData.id)
            }
        )
    }

    async create(
        data: CreateNewFulfillmentInput
    ): Promise<NewFulfillment> {
        return await this.atomicPhase_(async (manager) => {
            try {
                const newFulfillmentRepo = manager.withRepository(
                    this.newFulfillmentRepository_
                )


                const post = newFulfillmentRepo.create({

                    clinic_product_id: data.clinic_product_id,
                    vendor_product_id: data.vendor_product_id,
                    quantity: data.quantity,
                    tax: data.tax,
                    payment: data.payment,
                    shipment_status: data.shipment_status

                })
                // post.clinic_product_id = data.clinic_product_id
                // post.vendor_product_id = data.vendor_product_id
                const result = await newFulfillmentRepo.save(post)

                // console.log(result)
                return result
            } catch (error) {
                console.log(error)
            }
        })
    }


}

export default NewFulfillmentService