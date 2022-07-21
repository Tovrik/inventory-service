import { Resolver, Query, Mutation, Args, Int } from "@nestjs/graphql";
import { ProcessOrderInput } from "./dto/process-order.input";
import { Order } from "./models/order.model";
import { OrdersService } from "./orders.service";

@Resolver(() => Order)
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

  @Mutation((returns) => Order)
  async processOrder(
    @Args("processOrderInput") processOrderInput: ProcessOrderInput
  ): Promise<Order> {
    return await this.ordersService.processOrder(processOrderInput);
  }

  @Mutation((returns) => [Order])
  async processOrders(
    @Args("processOrderInput", { type: () => [ProcessOrderInput] })
    processOrderInputs: ProcessOrderInput[]
  ): Promise<Order[]> {
    return Promise.all(
      processOrderInputs.map(async (input) => {
        return await this.ordersService.processOrder(input);
      })
    );
  }
}
