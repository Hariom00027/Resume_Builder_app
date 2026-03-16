import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for auto-saving resume data.
 * 
 * Bugs fixed:
 *  - 2.3: Stale closure issue — saveFunction is now invoked via a stable ref so the
 *    latest version of handleSave (with the current `id` from useParams) is always used.
 *  - 4.9: lastSavedVersion is now compared against the latest resume reference obtained
 *    via a ref, not the stale closure value, so saves stop after the server round-trip.
 *
 * @param {Object} resume - The resume object to save
 * @param {Function} saveFunction - Function to call for saving
 * @param {Number} delay - Delay in milliseconds (default: 30000 = 30 seconds)
 * @param {Boolean} enabled - Whether auto-save is enabled (default: true)
 */
export function useAutoSave(resume, saveFunction, delay = 30000, enabled = true) {
  const hasUnsavedChanges = useRef(false);
  const lastSavedVersion = useRef(null);
  const saveTimeoutRef = useRef(null);
  const isInitialMount = useRef(true);

  // Always keep a ref to the latest saveFunction to avoid stale closures (Bug 2.3)
  const saveFnRef = useRef(saveFunction);
  useEffect(() => { saveFnRef.current = saveFunction; }, [saveFunction]);

  // Always keep a ref to the latest resume to avoid stale closures (Bug 4.9)
  const resumeRef = useRef(resume);
  useEffect(() => { resumeRef.current = resume; }, [resume]);

  // Track changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (resume) {
        lastSavedVersion.current = JSON.stringify(resume);
      }
      return;
    }

    if (!resume) return;

    const currentVersion = JSON.stringify(resume);
    if (currentVersion !== lastSavedVersion.current) {
      hasUnsavedChanges.current = true;
    }
  }, [resume]);

  // Auto-save on changes — uses refs so the callback always sees current data
  useEffect(() => {
    if (!enabled || !resume || !hasUnsavedChanges.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const currentResume = resumeRef.current; // always fresh (Bug 2.3 / 4.9)
      try {
        await saveFnRef.current(currentResume);
        hasUnsavedChanges.current = false;
        // Snapshot what we actually sent, not what gets back from server (Bug 4.9)
        lastSavedVersion.current = JSON.stringify(currentResume);
        console.log('✅ Auto-saved resume');
      } catch (error) {
        console.error('❌ Auto-save failed:', error);
        // Don't update lastSavedVersion on error so it will retry
      }
    }, delay);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [resume, delay, enabled]);

  // Save on window beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (enabled && hasUnsavedChanges.current && resumeRef.current) {
        saveFnRef.current(resumeRef.current).catch(console.error);
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled]);

  return {
    hasUnsavedChanges: hasUnsavedChanges.current
  };
}
