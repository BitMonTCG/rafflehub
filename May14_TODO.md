# BitMonTCG Raffle Hub Implementation Plan

## Phase 1: Core Raffle System Improvements

### Raffle Creation & Management
1. [✓] Add missing rarity options in "Create New Raffle" dropdown (e.g., Illustration Rare)
   - Added Common, Uncommon, Reverse Holo, Rainbow Rare, Illustration Rare, Special Illustration Rare, Hyper Rare, Full Art
   - Updated color coding for each rarity type in badges
2. [✓] Implement PSA Grading option when creating raffles
   - [✓] Add field for certification number
   - [✓] Enable manual entry of grade (1-10)
   - Added PSA badge display on cards with grading information
   - PSA certification number displayed in card details
3. [✓] Enable uploading of front and back card photos (2 photos total)
   - Added back image URL field to database schema
   - Updated card flip animation to show custom back image when available
   - Falls back to default Pokemon card back when no custom back image provided
4. [✓] Fix issue: Active raffles don't display images
   - Added error handling for failed image loads
   - Implemented fallback to placeholder image when original URL fails

**Database Migration Note:** The schema changes require a database migration to add the new fields: `backImageUrl`, `psaGrade`, and `psaCertNumber`. Run migration after deployment.

### Pricing Model
1. [✓] Update pricing formula:
   - [✓] Set raffle ticket price to the retail price divided by number of tickets, and let us set tickets but minimum $1 per ticket.
   - [✓] Set winner price to retail price minus 40%
2. [✓] Add manual entry for card prices (referencing eBay or PSA 10 values)
   - Added price source selection (PriceCharting, Collectr, eBay, PSA, TCGPlayer, Manual Entry)
   - Updated schema and client types to include priceSource field
3. [✓] Add pricing source attribution on Raffle Details page (pricecharting/collectr)
   - Added price source with website links on Raffle Details page in the Rules tab
   - Created helper functions to display proper source names and links
4. [✓] Add price fluctuation clause to ToS (10% adjustment right)
   - Added clause stating BitMonTCG reserves the right to adjust prices if market fluctuates by more than 10%
   - For fluctuations less than 10%, prices remain locked

## Phase 2: UI/UX Enhancements

1. [✓] Homepage Improvements:
   - [✓] Convert hero section to a slideshow featuring the card of the week
   - [✓] Remove redundant featured card section below the hero section
2. [✓] Raffle Details Page Enhancements:
   - [✓] Add raffle creation date
   - [✓] Display price source with website link
3. [✓] Create "How to Buy Crypto" guide page
   - [✓] Include crypto referral code

## Phase 3: Legal & Compliance

1. [✓] Update Company Information:
   - [✓] Change company name to BitMonTCG in ToS and all documents -- only legal documents doesnt have to be header etc. 
   - [✓] Fix incorrect email in ToS and Privacy Policy -- BitMonTCG@gmail.com
   - [✓] Remove address and phone number from documentation
   - [✓] Remove address and phone number from site (ex: footer)

## Phase 4: User Management & Communication

1. [✓] Review customer information collection system
   - [✓] Audit database for completeness of user profiles
   - [✓] Verify email list functionality
   - [✓] Implement strategy for user communications

## Future Enhancements (Post-Launch)

1. [ ] On-site Wallet System:
   - [ ] Minimum $10 deposit to improve banking transaction economics
   - [ ] Allow smaller purchases ($1) from wallet balance
2. [ ] Subscription Model:
   - [ ] Offer free tickets for common/tier 1 raffles with subscription
   - [ ] Create premium/tier 2 raffles requiring paid tickets
   - [ ] Evaluate profitability of subscription model with common raffles
3. [ ] Retweets, shares, etc. ways to earn referrals for free.

## Daily Implementation Checklist

_Check off tasks as you complete them and record the date:_

**Today's Focus:** [Write your daily focus here]
- [ ] Task: _________________ | Completed: __/__/__
- [ ] Task: _________________ | Completed: __/__/__