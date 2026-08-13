// Offices are fixed (member/congress/leader) rather than a configurable
// per-tribe rank table — Congress is titular for now (Phase 3), the Leader
// holds every actionable permission.
const OFFICE_PERMISSIONS = {
  member: [],
  congress: [],
  leader: ['claim_territory', 'set_policy', 'set_diplomacy_stance', 'post_announcement'],
};

function hasPermission(office, permission) {
  return (OFFICE_PERMISSIONS[office] || []).includes(permission);
}

module.exports = { OFFICE_PERMISSIONS, hasPermission };
