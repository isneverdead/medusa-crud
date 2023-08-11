import { NewFulfillment } from "../models/new-fulfillment"

export type UpdateNewFulfillmentInput = {
    id: string;
    clinic_product_id?: string;
    vendor_product_id?: string;
    quantity?: number
    tax?: number
    payment?: string
    shipment_status?: string
};
export type CreateNewFulfillmentInput = {
    clinic_product_id?: string;
    vendor_product_id?: string;
    quantity?: number
    tax?: number
    payment?: string
    shipment_status?: string
};

export interface AdminOnboardingUpdateStateReq { }

export type NewFulfillmentRes = {
    status: NewFulfillment;
};