import {Hit, Tag} from 'lib/server';
// import {unzip, zip} from 'lodash';
import {sortBy} from 'lodash';

/**
 *
 * Expect a group {orgs: Org[]}, Org={name, description, ...}
 *
 * e.g. orgs from localhost:5555/api/orgs/17755
 */
export function summarizeOrg(orgs: Hit[], reqId: number): Hit {
  const old = new Date();
  old.setFullYear(old.getFullYear() - 1000);
  orgs.sort((a, b) => ((new Date(b.updated_at || old)).valueOf() -
                       (new Date(a.updated_at || old)).valueOf()));

  const contacts = summarizeContacts(orgs);
  return {
    id: 0,
    name: summarizeName(orgs) || "",
    description: summarizeDescription(orgs) || "",
    updated_at: null,
    locs: summarizeLocations(orgs),
    phone: contacts.phone,
    email: contacts.email,
    website: contacts.website,
    tags: summarizeTags(orgs),

    fax: null,
    year_founded: null,
    created_at: null,
  };

  // const org = orgs.filter(o => o.id === reqId)[0];
  // org.name = summarizeName(orgs) || org.name;
  // return org;
}

function inc(votes: Map<string, number>, name: string) {
  votes.set(name, (votes.get(name) || 0) + 1);
}

export function summarizeName(orgs: {name: string | null}[]) {
  if (orgs.length < 2) { return orgs[0] && orgs[0].name; }

  const votes = new Map<string, number>();
  orgs.forEach(org => votes.set(org.name || "", 0));
  orgs.forEach(org => inc(votes, org.name || ""));

  const caseless = new Set<string>([...votes.keys()].map(o => o.toLowerCase()));
  for (const org of orgs) {
    const name = org.name || "";
    if (caseless.has(name.toLowerCase())) {
      inc(votes, name);
    }
    const lows = name.replace(/[^A-Z]/g, '').length;
    const len = name.length;
    if (lows < len / 2) { inc(votes, name); }
    if (lows > 0) { inc(votes, name); }
  }
  const result0 = [...votes.entries()];
  const result = sortBy(result0, [(r: any) => -r[1],
                                  (r: any) => -r[0].length] as any);
  return result[0][0];
}

export function summarizeDescription(orgs: {description: string | null}[]) {
  const result = sortBy(orgs, [(r: any) => -(r.description || "").length,
                               (r: any) => (r.description || "")] as any);
  return result[0].description;
}

export function summarizeLocations(orgs: Hit[]) {
  for (const org of orgs) {
    const idx = org.locs.findIndex(loc => Boolean(loc.is_primary));
    if (idx !== -1) {
      if (org.locs[idx].state) {
        return org.locs;
      }
    }
  }
  return [];
}

export function preferSite(v1: string | null, v2: string | null) {
  if (!v2) { return v1; }
  if (!v1) { return v2; }
  if (v2.includes('.coop') && !v1.includes('.coop')) {
    return v2;
  }
  return v1;
}

interface Contacts {
  phone: string | null,
  email: string | null,
  website: string | null,
}

export function summarizeContacts(orgs: Hit[]) {
  const result: Contacts = {
    phone: null,
    email: null,
    website: null,
  };
  for (const org of orgs) {
    if (!result.phone) { result.phone = org.phone; }
    result.email = preferSite(result.email, org.email);
    result.website = preferSite(result.email, org.website);
  }
  return result;
}

export function summarizeTags(orgs: Hit[]) {
  const present = new Set<number>();
  const tags: Tag[] = [];
  let tagListPresent: boolean = false;
  for (const org of orgs) {
    if (!org.tags) { continue; }
    tagListPresent = true;
    for (const tag of org.tags) {
      if (present.has(tag.id)) { continue; }
      tags.push(tag);
      present.add(tag.id);
    }
  }
  return tagListPresent ? tags : undefined;
}
