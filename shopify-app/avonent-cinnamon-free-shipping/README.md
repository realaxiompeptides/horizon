# Avonent Cinnamon Subscription Free Shipping

Exact Shopify shipping rule for the live Avonent cinnamon product.

## Eligibility

Free shipping is returned only when all of the following are true:

- Product: `gid://shopify/Product/15913339191462`
- Appstle selling plan: `gid://shopify/SellingPlan/3655467174`
- Total eligible subscription quantity: **2 or more**

One-time purchases have no `sellingPlanAllocation` and never count.

## Expected behavior

| Cart | Free shipping |
|---|---|
| 1 cinnamon Subscribe & Save | No |
| 2 cinnamon Subscribe & Save | Yes |
| 3 cinnamon Subscribe & Save | Yes |
| 1 cinnamon subscription added twice separately | Yes |
| 1 cinnamon subscription + 1 cinnamon one-time | No |
| 2+ cinnamon one-time | No |
| Other subscription products | No |
| Different Appstle selling plan | No |

The Function target is `cart.delivery-options.discounts.generate.run` and applies a 100% delivery discount to every delivery group only after the exact eligibility rule passes.

## Important

This code is intentionally kept on a separate Git branch and is not part of the live Horizon theme.

Shopify Functions must be linked to a Shopify app and deployed as an app extension before they can execute at checkout. The app-link/deploy step requires Shopify CLI authentication and cannot be replaced by a theme file upload or normal Admin API mutation.
