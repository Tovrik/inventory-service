import { InputType, Int, Field, OmitType } from "@nestjs/graphql";
import { Order } from "../models/order.model";

@InputType()
export class ProcessOrderInput extends OmitType(
  Order,
  ["fulfilled"] as const,
  InputType
) {}
