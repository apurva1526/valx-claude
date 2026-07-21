import { useEffect, useMemo, useState } from "react";
import * as Contacts from "expo-contacts";

export interface ContactEntry {
  id: string;
  name: string;
  phoneNumber: string;
}

export function useContactsPicker() {
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        setPermissionDenied(true);
        setIsLoadingContacts(false);
        return;
      }

      const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.PhoneNumbers] });
      const entries: ContactEntry[] = data
        .filter((c) => c.phoneNumbers && c.phoneNumbers.length > 0 && c.name)
        .map((c) => ({
          id: c.id!,
          name: c.name!,
          phoneNumber: c.phoneNumbers![0].number!.replace(/[\s\-()]/g, ""),
        }));
      setContacts(entries);
      setIsLoadingContacts(false);
    })();
  }, []);

  const filtered = useMemo(
    () => contacts.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [contacts, search]
  );

  const toggle = (id: string, exclusive = false) => {
    setSelected((prev) => {
      if (exclusive) {
        return prev.has(id) ? new Set() : new Set([id]);
      }
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedContacts = contacts.filter((c) => selected.has(c.id));

  return {
    isLoadingContacts,
    permissionDenied,
    search,
    setSearch,
    filtered,
    selected,
    toggle,
    selectedContacts,
  };
}
