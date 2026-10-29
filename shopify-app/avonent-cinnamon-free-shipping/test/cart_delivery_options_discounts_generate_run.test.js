import test from "node:test";
import assert from "node:assert/strict";
import {
  cartDeliveryOptionsDiscountsGenerateRun,
  qualifyingSubscriptionQuantity,
} from "../src/cart_delivery_options_discounts_generate_run.js";

const PRODUCT = "gid://shopify/Product/15913339191462";
const PLAN = "gid://shopify/SellingPlan/3655467174";
const OTHER_PRODUCT = "gid://shopify/Product/999";

function line({
  quantity = 1,
  productId = PRODUCT,
  planId = PLAN,
  subscription = true,
} = {}) {
  return {
    quantity,
    merchandise: {
      __typename: "ProductVariant",
      product: { id: productId },
    },
    sellingPlanAllocation: subscription
      ? { sellingPlan: { id: planId } }
      : null,
  };
}

function input(
  lines,
  {
    shippingClass = true,
    groups = ["gid://shopify/CartDeliveryGroup/1"],
  } = {},
) {
  return {
    cart: {
      lines,
      deliveryGroups: groups.map((id) => ({ id })),
    },
    discount: {
      discountClasses: shippingClass ? ["SHIPPING"] : ["PRODUCT"],
    },
  };
}

function isFree(result) {
  return result.operations.length > 0;
}

test("Buy 1 subscription does NOT get free shipping", () => {
  const cart = input([line({ quantity: 1 })]);
  assert.equal(qualifyingSubscriptionQuantity(cart), 1);
  assert.equal(isFree(cartDeliveryOptionsDiscountsGenerateRun(cart)), false);
});

test("Buy 2 subscription gets free shipping", () => {
  const result = cartDeliveryOptionsDiscountsGenerateRun(
    input([line({ quantity: 2 })]),
  );
  assert.equal(isFree(result), true);
  assert.equal(
    result.operations[0].deliveryDiscountsAdd.candidates[0].value.percentage.value,
    100,
  );
});

test("Buy 3 subscription gets free shipping", () => {
  assert.equal(
    isFree(
      cartDeliveryOptionsDiscountsGenerateRun(
        input([line({ quantity: 3 })]),
      ),
    ),
    true,
  );
});

test("two separate eligible subscription lines are summed", () => {
  const cart = input([line(), line()]);
  assert.equal(qualifyingSubscriptionQuantity(cart), 2);
  assert.equal(isFree(cartDeliveryOptionsDiscountsGenerateRun(cart)), true);
});

test("one-time purchases never count even at quantity 3", () => {
  const cart = input([line({ quantity: 3, subscription: false })]);
  assert.equal(qualifyingSubscriptionQuantity(cart), 0);
  assert.equal(isFree(cartDeliveryOptionsDiscountsGenerateRun(cart)), false);
});

test("one subscription plus one one-time purchase does not qualify", () => {
  const cart = input([line(), line({ subscription: false })]);
  assert.equal(qualifyingSubscriptionQuantity(cart), 1);
  assert.equal(isFree(cartDeliveryOptionsDiscountsGenerateRun(cart)), false);
});

test("other products and other selling plans do not count", () => {
  const cart = input([
    line({ productId: OTHER_PRODUCT }),
    line({ planId: "gid://shopify/SellingPlan/999" }),
    line({ quantity: 1 }),
  ]);
  assert.equal(qualifyingSubscriptionQuantity(cart), 1);
  assert.equal(isFree(cartDeliveryOptionsDiscountsGenerateRun(cart)), false);
});

test("two eligible subscriptions plus unrelated products still qualifies", () => {
  const cart = input([
    line({ quantity: 2 }),
    line({ productId: OTHER_PRODUCT, subscription: false }),
  ]);
  assert.equal(isFree(cartDeliveryOptionsDiscountsGenerateRun(cart)), true);
});

test("no SHIPPING discount class means no operation", () => {
  assert.equal(
    isFree(
      cartDeliveryOptionsDiscountsGenerateRun(
        input([line({ quantity: 2 })], { shippingClass: false }),
      ),
    ),
    false,
  );
});

test("no delivery group means no operation", () => {
  assert.equal(
    isFree(
      cartDeliveryOptionsDiscountsGenerateRun(
        input([line({ quantity: 2 })], { groups: [] }),
      ),
    ),
    false,
  );
});

test("all delivery groups receive 100% shipping discount when eligible", () => {
  const result = cartDeliveryOptionsDiscountsGenerateRun(
    input([line({ quantity: 2 })], {
      groups: [
        "gid://shopify/CartDeliveryGroup/1",
        "gid://shopify/CartDeliveryGroup/2",
      ],
    }),
  );

  assert.equal(result.operations.length, 2);
  for (const operation of result.operations) {
    assert.equal(operation.deliveryDiscountsAdd.selectionStrategy, "ALL");
    assert.equal(
      operation.deliveryDiscountsAdd.candidates[0].value.percentage.value,
      100,
    );
  }
});
