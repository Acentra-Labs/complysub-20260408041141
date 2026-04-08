import { createContext, useContext, useState, useCallback } from 'react';
import {
  generalContractors as initialGCs,
  subcontractors as initialSubs,
  certificates as initialCerts,
  notifications as initialNotifs,
  emailLog as initialEmails,
  insuranceAgents,
  subAgents,
  gcSubcontractors as initialGCSubs,
} from '../data/mockData';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [generalContractors, setGCs] = useState(initialGCs);
  const [subcontractors, setSubs] = useState(initialSubs);
  const [certificates, setCerts] = useState(initialCerts);
  const [notifications, setNotifications] = useState(initialNotifs);
  const [emailLogs, setEmailLogs] = useState(initialEmails);
  const [gcSubLinks, setGCSubLinks] = useState(initialGCSubs);

  // Add a new subcontractor
  const addSubcontractor = useCallback((sub, gcId) => {
    const newSub = {
      ...sub,
      id: `sub-${String(Date.now()).slice(-6)}`,
      tenant_id: 't-001',
      w9_on_file: false,
      w9_uploaded_at: null,
      w9_expires_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setSubs((prev) => [...prev, newSub]);

    if (gcId) {
      const link = {
        id: `gcs-${String(Date.now()).slice(-6)}`,
        gc_id: gcId,
        sub_id: newSub.id,
        added_at: new Date().toISOString(),
      };
      setGCSubLinks((prev) => [...prev, link]);
    }

    return newSub;
  }, []);

  // Add a certificate
  const addCertificate = useCallback((cert) => {
    const newCert = {
      ...cert,
      id: `cert-${String(Date.now()).slice(-6)}`,
      uploaded_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    setCerts((prev) => [...prev, newCert]);
    return newCert;
  }, []);

  // Mark notification as read
  const markNotificationRead = useCallback((notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  }, []);

  // Mark all notifications as read
  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // Log an email send
  const logEmail = useCallback((email) => {
    const newEmail = {
      ...email,
      id: `email-${String(Date.now()).slice(-6)}`,
      status: 'sent',
      sent_at: new Date().toISOString(),
      opened_at: null,
    };
    setEmailLogs((prev) => [...prev, newEmail]);
    return newEmail;
  }, []);

  // Link sub to GC
  const linkSubToGC = useCallback((subId, gcId) => {
    const exists = gcSubLinks.some((l) => l.gc_id === gcId && l.sub_id === subId);
    if (exists) return;
    setGCSubLinks((prev) => [
      ...prev,
      {
        id: `gcs-${String(Date.now()).slice(-6)}`,
        gc_id: gcId,
        sub_id: subId,
        added_at: new Date().toISOString(),
      },
    ]);
  }, [gcSubLinks]);

  const value = {
    generalContractors,
    subcontractors,
    certificates,
    notifications,
    emailLogs,
    insuranceAgents,
    subAgents,
    gcSubLinks,
    addSubcontractor,
    addCertificate,
    markNotificationRead,
    markAllNotificationsRead,
    logEmail,
    linkSubToGC,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
