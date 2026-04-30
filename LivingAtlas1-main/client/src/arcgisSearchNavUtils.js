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
 * Usage:
 *   const matchList = buildMatchList({ ... });
 *   const { currentIndex, total, currentMatchId, goToNext, goToPrev, initNav, resetNav } = useSearchNav(matchList);
 *
 *   // After search completes (call with the NEW match count):
 *   initNav(mList.length);
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
    const [currentIndex, setCurrentIndex] = useState(-1);
    const shouldScrollRef = useRef(false);

    // Scroll to the current match after each render where scroll was requested
    useEffect(() => {
        if (shouldScrollRef.current) {
            shouldScrollRef.current = false;
            if (currentIndex >= 0 && currentIndex < matchList.length) {
                const match = matchList[currentIndex];
                const el = document.querySelector(`[data-search-match-id="${match.id}"]`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    });

    // When layers load in asynchronously after a search that found 0 results,
    // auto-navigate to the first result once the match list becomes non-empty.
    useEffect(() => {
        if (currentIndex === -1 && matchList.length > 0) {
            shouldScrollRef.current = true;
            setCurrentIndex(0);
        }
    }, [matchList.length]); // eslint-disable-line react-hooks/exhaustive-deps

    const goToNext = useCallback(() => {
        if (matchList.length === 0) return;
        shouldScrollRef.current = true;
        setCurrentIndex(prev => (prev + 1) % matchList.length);
    }, [matchList.length]);

    const goToPrev = useCallback(() => {
        if (matchList.length === 0) return;
        shouldScrollRef.current = true;
        setCurrentIndex(prev => (prev - 1 + matchList.length) % matchList.length);
    }, [matchList.length]);

    /**
     * Call with the count of the NEW matchList (obtained before React re-renders)
     * so the initial index is set correctly.
     */
    const initNav = useCallback((newMatchCount) => {
        if (newMatchCount > 0) {
            shouldScrollRef.current = true;
            setCurrentIndex(0);
        } else {
            setCurrentIndex(-1);
        }
    }, []);

    const resetNav = useCallback(() => {
        setCurrentIndex(-1);
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
