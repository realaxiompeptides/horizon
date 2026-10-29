const TARGET_PRODUCT_ID = "gid://shopify/Product/15913339191462";
const TARGET_SELLING_PLAN_ID = "gid://shopify/SellingPlan/3655467174";
const MINIMUM_SUBSCRIPTION_QUANTITY = 2;

export function qualifyingSubscriptionQuantity(input) {
  return (input?.cart?.lines ?? []).reduce((total, line) => {
    if (line?.merchandise?.__typename !== "ProductVariant") return total;
    if (line.merchandise?.product?.id !== TARGET_PRODUCT_ID) return total;
    if (line?.sellingPlanAllocation?.sellingPlan?.id !== TARGET_SELLING_PLAN_ID) return total;

    const quantity = Number(line?.quantity ?? 0);
    return Number.isFinite(quantity) && quantity > 0 ? total + quantity : total;
  }, 0);
}

export function cartDeliveryOptionsDiscountsGenerateRun(input) {
  const hasShippingDiscountClass =
    (input?.discount?.discountClasses ?? []).includes("SHIPPING");

  if (!hasShippingDiscountClass) {
    return { operations: [] };
  }

  if (qualifyingSubscriptionQuantity(input) < MINIMUM_SUBSCRIPTION_QUANTITY) {
    return { operations: [] };
  }

  const deliveryGroups = input?.cart?.deliveryGroups ?? [];
  if (deliveryGroups.length === 0) {
    return { operations: [] };
  }

  return {
    operations: deliveryGroups.map((deliveryGroup) => ({
      deliveryDiscountsAdd: {
        candidates: [
          {
            message: "FREE Shipping — Subscribe & Save 2+",
            targets: [
              {
                deliveryGroup: {
                  id: deliveryGroup.id,
                },
              },
            ],
            value: {
              percentage: {
                value: 100,
              },
            },
          },
        ],
        selectionStrategy: "ALL",
      },
    })),
  };
}
