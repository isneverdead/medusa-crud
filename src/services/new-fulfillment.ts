import { ConfigModule, TransactionBaseService } from "@medusajs/medusa"
import NewFulfillmentRepository from "../repositories/new-fulfillment"
import ProductRepository from "../repositories/new-fulfillment"
import { NewFulfillment } from "../models/new-fulfillment"
import { EntityManager, IsNull, Not } from "typeorm"
import { UpdateNewFulfillmentInput, CreateNewFulfillmentInput } from "../types/new-fulfilment"
import { generateEntityId } from "@medusajs/utils"
import { Lifetime } from "awilix"

import { Product } from "@medusajs/medusa/dist/models"

type InjectedDependencies = {
    manager: EntityManager;
    newFulfillmentRepository: typeof NewFulfillmentRepository;
    productRepository: typeof ProductRepository;
};

// export type RetrieveNewFulfillment = {
//     clinicProduct: 

// } & NewFulfillment

class NewFulfillmentService extends TransactionBaseService {
    protected newFulfillmentRepository_: typeof NewFulfillmentRepository
    // protected productRepository_: typeof ProductRepository
    protected readonly configModule_: ConfigModule
    static LIFE_TIME = Lifetime.SCOPED


    // constructor({ newFulfillmentRepository, productRepository }: InjectedDependencies) {
    constructor(container) {

        super(container)

        this.newFulfillmentRepository_ = container.newFulfillmentRepository
        // this.productRepository_ = container.productRepository
    }

    async retrieve(id: string): Promise<NewFulfillment | undefined> {
        try {
            const newFulfillmentRepo = this.activeManager_.withRepository(
                this.newFulfillmentRepository_
            )
            // const productRepo = this.activeManager_.withRepository(
            //     this.productRepository_
            // )

            const fulfillmentData = await newFulfillmentRepo.findOne({
                where: { id: id },
            })

            // if (fulfillmentData.clinicProduct) {
            //     const clinicProduct = await productRepo.findOne({
            //         where: {
            //             id: fulfillmentData.clinic_product_id,
            //         },
            //     })

            //     // fulfillmentData.clinicProduct = {
            //     //     title: ""
            //     // }
            // }



            return fulfillmentData
        } catch (error) {
            console.log(error)
        }

    }

    // async update(
    //     data: UpdateNewFulfillmentInput
    // ): Promise<NewFulfillment> {
    //     return await this.atomicPhase_(
    //         async (transactionManager: EntityManager) => {
    //             const newFulfillmentRepository =
    //                 transactionManager.withRepository(
    //                     this.newFulfillmentRepository_
    //                 )

    //             // const status = await this.retrieve()

    //             // for (const [key, value] of Object.entries(data)) {
    //             //     status[key] = value
    //             // }

    //             return await newFulfillmentRepository.save(status)
    //         }
    //     )
    // }

    async create(
        data: CreateNewFulfillmentInput
        // data: Pick<CreateNewFulfillmentInput, "clinic_product_id" | "vendor_product_id" | "quantity" | "payment" | "shipment_status" | "tax">
    ): Promise<NewFulfillment> {
        return this.atomicPhase_(async (manager) => {
            try {
                const newFulfillmentRepo = manager.withRepository(
                    this.newFulfillmentRepository_
                )

                console.log("EXECUTED")
                // console.log("EXECUTED")
                // console.log("EXECUTED")
                // console.log(data)
                // console.log("EXECUTED")
                // const result = newFulfillmentRepo.create({
                //     id: generateEntityId(
                //         "",
                //         "new_fulfillment"),
                //     clinic_product_id: data.clinic_product_id,
                //     vendor_product_id: data.vendor_product_id,
                //     quantity: data.quantity,
                //     tax: data.tax,
                //     payment: data.payment,
                //     shipment_status: data.shipment_status

                // })
                const result = newFulfillmentRepo.create({
                    // id: generateEntityId(
                    //     "",
                    //     "new_fulfillment"),
                    // clinic_product_id: data.clinic_product_id,
                    // vendor_product_id: data.vendor_product_id,
                    quantity: data.quantity,
                    tax: data.tax,
                    payment: data.payment,
                    shipment_status: data.shipment_status

                })
                // post.clinic_product_id = data.clinic_product_id
                // post.vendor_product_id = data.vendor_product_id
                // const result = await newFulfillmentRepo.save(post)

                console.log(result)
                return result
            } catch (error) {
                console.log(error)
            }
        })
    }


}

export default NewFulfillmentService