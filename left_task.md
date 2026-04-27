# Left Tasks — VolunteerBridge

## ✅ Completed This Session

### Backend / API
- [done] `GET /api/volunteer-opportunities` — fetch NGO volunteer postings
- [done] `POST /api/volunteer-opportunities/:id/apply` — volunteer applies
- [done] `GET /api/volunteers/:id/assignments` — returns team + checklist + camp
- [done] `PATCH /api/requests/:requestId/checklist/:taskId/status` — update task status
- [done] `PATCH /api/volunteers/:id/profile` — update volunteer profile
- [done] `GET /api/volunteers/:id/applications` — fetch application statuses
- [done] Firebase `.env.local` all values filled in correctly

### Volunteer Frontend
- [done] `/volunteer/map` page — all camp locations on Leaflet map with sidebar
- [done] Application status tracking on opportunities list (Pending/Approved/Rejected badge)
- [done] Application status tracking on opportunity detail page (full state panels)
- [done] Team leader indicator — gold Crown badge if logged-in volunteer is leader
- [done] Skeleton loading on all volunteer pages (tasks, assignments, opportunities, map)
- [done] Toast notifications — profile save, task updates, application submit
- [done] Camp Map added to sidebar navigation
- [done] `ToastContainer` component created in `components/volunteer/`

---

## 🔴 Still Remaining (Must-Do)

### Build Fix
- [ ] Fix TypeScript error in `api/request.controller.ts:119` — cast `dbStatus` to string  
  *(Blocked: user said don't touch other roles — confirm if this is allowed)*

---

## 🟠 Volunteer — Minor Polish Left

- [ ] **Notification badge on sidebar** — show count of pending join-request responses  
  *(Needs a client-side hook to fetch join request status on layout mount)*
- [ ] **Real-time task sync** — Firebase listener instead of fetch-on-load  
  *(Low priority — optimistic updates already work)*
- [ ] **Mobile responsive audit** — test on small screens, adjust grid layouts  
- [ ] **`vb_volunteer_name` cookie** — set on login so Crown badge works correctly  
  *(Currently falls back to empty string comparison)*

---

## 🟡 NGO — NOT IN SCOPE (Tirth's task, do not touch)

- [ ] Raise Volunteer Request form → posts to `VolunteerOpportunity` collection
- [ ] Applicant list per volunteer request (Approve / Reject)
- [ ] Team Builder UI (named teams, team leader, assign to checklist tasks)
- [ ] Work checklist management per request
- [ ] Resource allocation panel per camp

---

## 🟢 Admin — Complete. Do not modify.
## 🔵 Citizen — Complete. Do not modify.

---

## 📋 Next Session Priorities

1. Fix build error (`api/request.controller.ts:119`) — one-line cast fix  
2. Add `vb_volunteer_name` cookie write on volunteer login  
3. Sidebar notification badge (fetch pending join requests count)  
4. Mobile responsive audit for all volunteer pages  
5. Hand off NGO tasks to NGO team member  
