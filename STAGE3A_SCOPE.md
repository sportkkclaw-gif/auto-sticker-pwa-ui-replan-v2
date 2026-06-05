# STAGE3A_SCOPE — AUTO 動態貼圖

status: planning_draft_only
repo: sportkkclaw-gif/auto-sticker-pwa-ui-replan-v2
branch: acceptance
final_status_wording: Stage 3A planning draft ready for owner review.

## Purpose
Stage 3A is a planning-only proposal for a true AI Provider Pilot. It must validate whether one real AI provider can feed Stage 2's existing work / generation_job / generated_images / ZIP / generation_manifest / hash evidence structure without production launch, live payment, or formal DB migration.

## Current baseline
- Stage 1: APPROVED.
- Stage 2: APPROVED - bounded mock_non_placeholder scope.
- Live AI: NOT APPROVED.
- Live Payment: NOT APPROVED.
- Formal DB: NOT APPROVED.
- Commercial Launch Ready: NO.

## Stage 3A proposed scope
- Select one provider for pilot only.
- Keep mock_non_placeholder fallback.
- Add provider evidence planning around provider_job_id, request_id, model, prompt_hash, input_hash, and output_hash.
- Preserve Stage 2 credit reserve / commit / refund / retry semantics.
- Preserve ZIP and generation_manifest hash verification.
- Plan acceptance:stage3a to prove provider output is not mock output.

## Out of scope
- No live payment.
- No production deploy.
- No PR merge.
- No formal DB migration.
- No admin dashboard.
- No marketplace/community features.
- No Stage 3A implementation until owner approves.

## Provider recommendation
Recommended provider for owner review: fal.ai.

Reason: It is API-oriented, usually fast enough for image generation pilots, and maps well to async request / provider_job_id evidence. This is not an owner-locked decision yet.

## Required owner decisions before implementation
1. Approve or replace fal.ai as Stage 3A provider.
2. Approve maximum pilot budget.
3. Approve whether provider calls run only locally, preview only, or both.
4. Approve whether provider outputs may be stored in repo evidence artifacts or only hash/metadata.
5. Approve whether Stage 3A may create a new feature branch.

## Final status
Stage 3A planning draft ready for owner review.
