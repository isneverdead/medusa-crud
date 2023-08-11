
export declare module "@medusajs/medusa/dist/models/new-fulfillment" {
    declare interface NewFulfillment {
        clinic_product_id?: string;
        clinicProduct?: Product;
        vendor_product_id?: string;
        vendorProduct?: Product;
        quantity?: number
        tax?: number
        payment?: string
        shipment_status?: string
    }
}
// export declare module "@medusajs/medusa/dist/models/discount" {
//     declare interface Discount {
//         store_id?: string;
//         store?: Store;
//     }
// }

export declare module "@medusajs/medusa/dist/models/user" {
    declare interface User {
        store_id?: string;
        store?: Store;
        customRole?: CustomUserRoleEnum;

    }
}