import { registerEnumType } from "@nestjs/graphql";

export enum OrderType {
  RESERVE,
  PURCHASE,
}

registerEnumType(OrderType, { name: "OrderType" });
