// import {
//     dataSource,
// } from "@medusajs/medusa/dist/loaders/database"
// import { NewFulfillment } from "../models/new-fulfillment"

// const NewFulfillmentRepository = dataSource.getRepository(
//     NewFulfillment
// )

// export default NewFulfillmentRepository

import { NewFulfillment } from "../models/new-fulfillment"
import { 
  dataSource,
} from "@medusajs/medusa/dist/loaders/database"

export const NewFulfillmentRepository = dataSource
  .getRepository(NewFulfillment)

export default NewFulfillmentRepository