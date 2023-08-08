import { Router } from "express";
import customRouteHandler from "./custom-route-handler";
import { wrapHandler } from "@medusajs/medusa";
import NewFulfillmentService from "../../../services/new-fulfillment"
import cors from "cors"
import {
  ConfigModule,
} from "@medusajs/medusa/dist/types/global"

// Initialize a custom router

export function attachAdminRoutes(adminRouter: Router, options: ConfigModule
) {
  const router = Router();
  const { projectConfig } = options

  const corsOptions = {
    origin: projectConfig.admin_cors.split(","),
    credentials: true,
  }
  adminRouter.use(cors(corsOptions))
  // Attach our router to a custom path on the admin router
  adminRouter.use("/", router);

  // Define a GET endpoint on the root route of our custom path
  router.get("/", wrapHandler(customRouteHandler));


  router.get(
    "/new",
    wrapHandler(async (req, res) => {

      res.json({
        posts: "hei"
      })
    }))
  router.post("/create-new-fulfillment", async (req, res) => {
    try {

      const request = await req.body

      // console.log(req.scope.hasRegistration('loggedInUser'))
      // const loggedIn = await req.scope.resolve('loggedInUser')
      const newFulfillmentService =
        req.scope.resolve("newFulfillmentService") as NewFulfillmentService

      // console.log(loggedIn)




      const result = await newFulfillmentService.create({
        clinic_product_id: request.clinic_product_id,
        vendor_product_id: request.vendor_product_id,
        quantity: request.quantity,
        tax: request.tax,
        payment: request.payment,
        shipment_status: request.shipment_status
      })

      // console.log(result)
      res.json({
        // message: "Successfuly fetched!",
        result: result,
      })
    } catch (error) {
      console.log(error)
      res.statusCode = 501
      res.json({
        message: "Something went wrong!",

      })
    }
  })
}
