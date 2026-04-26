// Admin audit log helper.
//
// Every mutating admin server action calls logAdminAction() with the actor,
// action key, target, and before/after snapshots. Writes go through the
// service-role client (admin actions already use it for the mutation itself).
//
// Best-effort: a logging failure is logged to console but does NOT fail the
// admin action. Audit-trail integrity is sacrificed in favour of operator
// usability — alternative is harder to diagnose when an audit insert errors.
//
// Action keys (stable strings — once chosen, do not rename without a
// migration to update existing rows):
//   approve_user, suspend_user, reinstate_user, blacklist_user
//   renew_guest, cancel_guest
//   change_pathway, change_limits, change_subgroup, change_org
//   toggle_training_approval, toggle_practitioner_approval
//   grant_admin, revoke_admin
//   create_org, update_org, create_subgroup, delete_subgroup
//   assign_org_reviewer, assign_subgroup_reviewer
//   bulk_approve

import { createServiceClient } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"

export type TargetType =
  | "profile"
  | "organisation"
  | "org_subgroup"
  | "admin_user"
  | "bulk"

export interface LogParams {
  actor: User              // from requireAdmin().user
  action: string
  targetType: TargetType
  targetId?: string | null
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export async function logAdminAction(params: LogParams): Promise<void> {
  try {
    const serviceClient = await createServiceClient()
    const { error } = await serviceClient
      .from("admin_audit_log")
      .insert({
        actor_id:    params.actor.id,
        actor_email: params.actor.email ?? "",
        action:      params.action,
        target_type: params.targetType,
        target_id:   params.targetId ?? null,
        before:      params.before ?? null,
        after:       params.after ?? null,
        metadata:    params.metadata ?? null,
      })
    if (error) {
      console.warn("logAdminAction: insert failed", {
        action: params.action,
        targetId: params.targetId,
        error: error.message,
      })
    }
  } catch (e) {
    console.warn("logAdminAction: unexpected error", {
      action: params.action,
      error: (e as Error).message,
    })
  }
}
