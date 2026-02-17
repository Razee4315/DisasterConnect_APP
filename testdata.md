# DisasterConnect Test Data — Skardu, Pakistan

> All test data uses `[TEST]` prefix and `TEST_SKARDU` organization for easy identification and deletion.

---

## Test Accounts

| # | Email | Password | Name | Role | Phone |
|---|-------|----------|------|------|-------|
| 1 | `ahmed@test.com` | `12345` | Ahmed Khan | Administrator | +92-3451234001 |
| 2 | `fatima@test.com` | `12345` | Fatima Bibi | Coordinator | +92-3451234002 |
| 3 | `hassan@test.com` | `12345` | Hassan Ali | Emergency Responder | +92-3451234003 |
| 4 | `zara@test.com` | `12345` | Zara Hussain | Volunteer | +92-3451234004 |
| 5 | `imran@test.com` | `12345` | Imran Shah | Medical Staff | +92-3451234005 |
| 6 | `nadia@test.com` | `12345` | Nadia Karim | Logistics | +92-3451234006 |

All accounts share organization: `TEST_SKARDU`

---

## Incidents (5)

| Title | Type | Severity | Status | Location |
|-------|------|----------|--------|----------|
| Flash Flood in Shigar Valley | Flood | Critical | In Progress | Shigar (35.33, 75.73) |
| Landslide on Skardu-Gilgit Highway | Natural Disaster | High | Verified | Roundu (35.38, 75.41) |
| Avalanche near Deosai Plains | Natural Disaster | Medium | Reported | Deosai (35.09, 75.54) |
| Earthquake Tremors in Khaplu | Earthquake | High | In Progress | Khaplu (35.15, 76.33) |
| Bridge Collapse at Satpara | Infrastructure | Critical | In Progress | Satpara (35.26, 75.63) |

---

## Teams (3)

| Team | Lead | Assigned Incident | Members |
|------|------|-------------------|---------|
| Skardu Flood Response Team | Fatima Bibi | Shigar Flood | Fatima, Hassan, Zara, Nadia |
| Medical Emergency Unit | Imran Shah | Khaplu Earthquake | Imran, Zara, Hassan |
| Logistics & Supply Chain | Nadia Karim | — | Nadia, Ahmed, Fatima |

---

## Resources (8)

| Resource | Type | Status | Location |
|----------|------|--------|----------|
| Medical Supply Kit Alpha | Medical | Assigned | Skardu CMH |
| Emergency Tents (50 units) | Shelter | Assigned | Shigar Fort |
| Food Package Consignment | Food | Assigned | Skardu Airport |
| Search & Rescue Equipment | Emergency | Assigned | Deosai Base Camp |
| Water Purification Units | Water | Assigned | Shigar Valley |
| Diesel Generators (3 units) | Other | Available | Skardu DC Office |
| Ambulance Fleet | Vehicle | Assigned | Skardu City Hospital |
| Satellite Comms Gear | Communication | Available | Skardu Airport |

---

## Tasks (12)

| Task | Priority | Status | Assigned To |
|------|----------|--------|-------------|
| Evacuate lower Shigar families | Urgent | In Progress | Hassan |
| Set up medical camp at Shigar Fort | Urgent | Completed | Imran |
| Clear KKH debris near Roundu | High | Pending | Hassan |
| Distribute food to Satpara villages | Urgent | In Progress | Nadia |
| Deploy water purifiers to flood zone | High | Completed | Nadia |
| Search for missing shepherds near Deosai | Urgent | In Progress | Hassan |
| Assess structural damage in Khaplu | High | In Progress | Zara |
| Set up emergency shelter at Stadium | Medium | Pending | Nadia |
| Inventory remaining medical supplies | Medium | Pending | Imran |
| Prepare situation report for NDMA | High | In Progress | Ahmed |
| Install pontoon bridge at Satpara | Urgent | Pending | Hassan |
| Register displaced families at camp | Medium | Completed | Zara |

---

## Channels & Messages (5 channels, 30+ messages)

| Channel | Type | Members | Messages |
|---------|------|---------|----------|
| Shigar Flood Operations | Incident | All 6 users | 11 messages |
| Medical Team Coordination | Team | Imran, Zara, Hassan | 5 messages |
| All Skardu Updates | Broadcast | All 6 users | 3 messages |
| Fatima & Hassan DM | Direct | Fatima, Hassan | 6 messages |
| Khaplu Earthquake Response | Incident | Ahmed, Fatima, Imran, Hassan | 7 messages |

---

## Alerts (5)

| Alert | Type | Severity | Active |
|-------|------|----------|--------|
| EMERGENCY: Flash Flood - Evacuate | Emergency | Critical | Yes |
| WARNING: Aftershock Risk in Khaplu | Warning | High | Yes |
| ADVISORY: KKH Blocked at Roundu | Advisory | Medium | Yes |
| INFO: Relief Distribution Schedule | Information | Low | Yes |
| WARNING: Heavy Rain Forecast | Warning | High | Yes |

---

## Donations (8)

| Donor | Type | Amount/Qty | Status |
|-------|------|-----------|--------|
| Aga Khan Foundation | Monetary | PKR 50 lakh | Received |
| Pakistan Army | Shelter | 100 tents | Distributed |
| Al-Khidmat Foundation | Food | 300 packages | Received |
| Skardu Business Community | Monetary | PKR 15 lakh | Pledged |
| WHO Pakistan | Medical | 50 kits | Distributed |
| UNICEF | Water | 100K tablets | Received |
| Overseas Pakistanis UK | Monetary | PKR 25 lakh | Received |
| Skardu Youth Volunteers | Clothing | 500 items | Distributed |

---

## Evacuation Routes (3)

| Route | Distance | Time | Capacity |
|-------|----------|------|----------|
| Shigar to Shigar Fort (Primary) | 4.2 km | 25 min | 500 |
| Khaplu Chaqchan to Sports Ground | 1.8 km | 15 min | 2000 |
| Satpara Villages to Skardu (Alt) | 12.5 km | 90 min | 200 |

---

## SOS Broadcasts (3)

| Message | Severity | Status |
|---------|----------|--------|
| Family of 7 stranded on rooftop, Shigar | Critical | Resolved |
| 2 people trapped under wall, Khaplu | Critical | Resolved |
| Lost contact with search team, Deosai | High | Active |

---

## How to Delete All Test Data

Run this SQL in Supabase SQL Editor (in order):

```sql
-- Delete all test data (cascading via foreign keys)
DELETE FROM notifications WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@test.com');
DELETE FROM messages WHERE sender_id IN (SELECT id FROM auth.users WHERE email LIKE '%@test.com');
DELETE FROM channel_members WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@test.com');
DELETE FROM channels WHERE created_by IN (SELECT id FROM auth.users WHERE email LIKE '%@test.com');
DELETE FROM sos_broadcasts WHERE sender_id IN (SELECT id FROM auth.users WHERE email LIKE '%@test.com');
DELETE FROM incident_updates WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@test.com');
DELETE FROM tasks WHERE title LIKE '[TEST]%';
DELETE FROM team_members WHERE team_id IN (SELECT id FROM teams WHERE name LIKE '[TEST]%');
DELETE FROM teams WHERE name LIKE '[TEST]%';
DELETE FROM donations WHERE donor_name IN ('Aga Khan Foundation','Pakistan Army (Northern Command)','Al-Khidmat Foundation','Skardu Business Community','WHO Pakistan','UNICEF','Overseas Pakistanis (UK Chapter)','Local Volunteers - Skardu Youth');
DELETE FROM alerts WHERE title LIKE '[TEST]%';
DELETE FROM evacuation_routes WHERE name LIKE '[TEST]%';
DELETE FROM resources WHERE name LIKE '[TEST]%';
DELETE FROM incidents WHERE title LIKE '[TEST]%';
DELETE FROM profiles WHERE organization = 'TEST_SKARDU';
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@test.com');
DELETE FROM auth.users WHERE email LIKE '%@test.com';
```
