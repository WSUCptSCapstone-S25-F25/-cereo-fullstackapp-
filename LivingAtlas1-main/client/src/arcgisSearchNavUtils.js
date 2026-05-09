import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Build an ordered flat list of all matched items from a filterUploadPanelData result.
 * Used for search result navigation (prev / next).
 *
 * Match ID format:
 *   folder  → "folder-{stateCode}-{folderName}"
 *   service → "service-{serviceKey}"
 *   layer   → "layer-{serviceKey}-{layerId}"
 *
 * @param {object} params
 * @param {object|null}  params.searchResult       - Result from filterUploadPanelData
 * @param {object}       params.allServicesByState  - { stateCode: service[] }
 * @param {string[]}     params.stateCodes
 * @param {object}       params.serviceLayers       - { serviceKey: flatLayer[] }
 * @returns {Array<{id: string, type: 'folder'|'service'|'layer', stateCode: string, folder: string, serviceKey?: string, layerId?: number}>}
 */
export function buildMatchList({ searchResult, allServicesByState, stateCodes, serviceLayers }) {
    if (!searchResult) return [];

    const matches = [];

    stateCodes.forEach(stateCode => {
        const stateServices = allServicesByState[stateCode] || [];

        // Group by folder, sorted
        const byFolder = {};
        stateServices.forEach(service => {
            const folder = service.folder || 'Root';
            if (!byFolder[folder]) byFolder[folder] = [];
            byFolder[folder].push(service);
        });
        const folderNames = Object.keys(byFolder).sort();

        folderNames.forEach(folder => {
            const filteredServices = searchResult.filteredFolders?.[folder] || [];
            if (filteredServices.length === 0) return;

            // Only process folders where at least one filtered service actually belongs to
            // this state. Without this check, a shared folder name (e.g. "Root") in a
            // non-scoped state would match the scoped state's filteredFolders entries and
            // inflate the total count with invisible matches.
            const hasLocalService = filteredServices.some(
                fs => stateServices.some(s => s.key === fs.key)
            );
            if (!hasLocalService) return;

            // Folder-level match
            if (searchResult.matchedFolderNames?.has(folder)) {
                matches.push({ id: `folder-${stateCode}-${folder}`, type: 'folder', stateCode, folder });
            }

            filteredServices.forEach(filteredService => {
                const service = stateServices.find(s => s.key === filteredService.key);
                if (!service) return;

                // Service-level match
                if (searchResult.matchedServiceKeys?.has(service.key)) {
                    matches.push({ id: `service-${service.key}`, type: 'service', stateCode, folder, serviceKey: service.key });
                }

                // Layer-level matches (in original flat-layer order)
                const matchedLayerSet = searchResult.matchedLayerIds?.[service.key];
                if (matchedLayerSet && matchedLayerSet.size > 0) {
                    const flatLayers = serviceLayers[service.key] || [];
                    flatLayers
                        .filter(l => matchedLayerSet.has(l.id))
                        .forEach(l => {
                            matches.push({
                                id: `layer-${service.key}-${l.id}`,
                                type: 'layer',
                                stateCode,
                                folder,
                                serviceKey: service.key,
                                layerId: l.id,
                            });
                        });
                }
            });
        });
    });

    return matches;
}

/**
 * React hook for search result navigation.
 * Scrolls to DOM elements via [data-search-match-id] attributes.
 *
 * Tracks the current match by stable ID rather than by list position, so async
 * layer insertions that shift positions never corrupt navigation direction.
 *
 * Usage:
 *   const matchList = buildMatchList({ ... });
 *   const { currentIndex, total, currentMatchId, goToNext, goToPrev, initNav, resetNav } = useSearchNav(matchList);
 *
 *   // After search completes (call with the NEW match list):
 *   initNav(mList);
 *
 *   // After clear:
 *   resetNav();
 *
 *   // Mark matched DOM elements:
 *   <div data-search-match-id="layer-myService-5" className={currentMatchId === 'layer-myService-5' ? 'search-nav-current' : ''} />
 *
 * @param {Array} matchList - From buildMatchList
 */
export function useSearchNav(matchList) {
    // Track by stable match ID, not by position. Positions shift when async layers
    // load and insert entries; IDs do not.
    const [currentId, setCurrentId] = useState(null);
    const shouldScrollRef = useRef(false);

    // Derive the positional index on each render (O(n) but list is small).
    const currentIndex = currentId ? matchList.findIndex(m => m.id === currentId) : -1;

    // Scroll to the current match after each render where scroll was requested.
    useEffect(() => {
        if (shouldScrollRef.current) {
            shouldScrollRef.current = false;
            if (currentId) {
                const el = document.querySelector(`[data-search-match-id="${currentId}"]`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    });

    // When layers load in asynchronously after a search that found 0 results,
    // auto-navigate to the first result once the match list becomes non-empty.
    useEffect(() => {
        if (!currentId && matchList.length > 0) {
            shouldScrollRef.current = true;
            setCurrentId(matchList[0].id);
        }
    }, [matchList.length]); // eslint-disable-line react-hooks/exhaustive-deps

    const goToNext = useCallback(() => {
        if (matchList.length === 0) return;
        shouldScrollRef.current = true;
        setCurrentId(prevId => {
            const idx = prevId ? matchList.findIndex(m => m.id === prevId) : -1;
            const next = idx === -1 ? 0 : (idx + 1) % matchList.length;
            return matchList[next].id;
        });
    }, [matchList]);

    const goToPrev = useCallback(() => {
        if (matchList.length === 0) return;
        shouldScrollRef.current = true;
        setCurrentId(prevId => {
            const idx = prevId ? matchList.findIndex(m => m.id === prevId) : -1;
            const next = idx === -1 ? matchList.length - 1 : (idx - 1 + matchList.length) % matchList.length;
            return matchList[next].id;
        });
    }, [matchList]);

    /**
     * Call with the NEW matchList (obtained before React re-renders) so the initial
     * match ID is recorded correctly from the start.
     */
    const initNav = useCallback((newMatchList) => {
        if (newMatchList.length > 0) {
            shouldScrollRef.current = true;
            setCurrentId(newMatchList[0].id);
        } else {
            setCurrentId(null);
        }
    }, []);

    const resetNav = useCallback(() => {
        setCurrentId(null);
        shouldScrollRef.current = false;
    }, []);

    return {
        currentIndex,
        total: matchList.length,
        /** ID of the currently focused match; use to add highlight class on matching DOM elements */
        currentMatchId: matchList[currentIndex]?.id ?? null,
        goToNext,
        goToPrev,
        initNav,
        resetNav,
    };
}
