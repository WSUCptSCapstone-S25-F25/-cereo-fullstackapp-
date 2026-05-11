import React, { useEffect, useMemo, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import './OnboardingGeneral.css';

const STEP_DEFINITIONS = [
    {
        selector: '[data-onboarding-target="navbar-root"]',
        title: 'Top Navbar',
        description: 'This top navbar provides global navigation across the app at all times.',
        placement: 'bottom',
    },
    {
        selector: '[data-onboarding-target="navbar-brand"]',
        title: 'App Title',
        description: 'Click the app title to return to the home map page quickly.',
        placement: 'bottom',
    },
    {
        selector: '[data-onboarding-target="navbar-cereo-link"]',
        title: 'CEREO Website Link',
        description: 'Use this logo link to open the CEREO website in a new tab.',
        placement: 'bottom',
    },
    {
        selector: '[data-onboarding-target="navbar-home-link"]',
        title: 'Home Link',
        description: 'Go to the main map and panel workspace.',
        placement: 'bottom',
    },
    {
        selector: '[data-onboarding-target="navbar-about-link"]',
        title: 'About Link',
        description: 'Open the About page for project background and context.',
        placement: 'bottom',
    },
    {
        selector: '[data-onboarding-target="navbar-contact-link"]',
        title: 'Contact Link',
        description: 'Open the Contact page for support and communication channels.',
        placement: 'bottom',
    },
    {
        selector: '[data-onboarding-target="navbar-updates-link"]',
        title: 'Updates Link',
        description: 'View product update history and recent feature changes.',
        placement: 'bottom',
    },
    {
        selector: '[data-onboarding-target="navbar-manual-link"]',
        title: 'User Manual Link',
        description: 'Open the full user manual when you need detailed instructions.',
        placement: 'bottom',
    },
    {
        selector: '[data-onboarding-target="navbar-auth-link"]',
        title: 'Account Area',
        description: 'Use this area to log in/register, or manage profile and account actions when signed in.',
        placement: 'bottom',
    },
    {
        selector: '[data-onboarding-target="left-sidebar-root"]',
        title: 'Left Sidebar',
        description: 'This sidebar is the main launcher for map panels and global app controls.',
        placement: 'right',
    },
    {
        selector: '[data-onboarding-target="left-sidebar-search"]',
        title: 'Search Button',
        description: 'Open mini search to quickly find cards by keyword.',
        placement: 'right',
    },
    {
        selector: '[data-onboarding-target="left-sidebar-cards"]',
        title: 'Cards Panel Button',
        description: 'Open the Cards panel. To start its onboarding: open the panel, then click the play/start onboarding button in the card panel title bar.',
        placement: 'right',
    },
    {
        selector: '[data-onboarding-target="left-sidebar-gis"]',
        title: 'GIS Services Button',
        description: 'Open ArcGIS Upload Panel. To start its onboarding: open the panel, then click the Tutorial play button in the panel header.',
        placement: 'right',
    },
    {
        selector: '[data-onboarding-target="left-sidebar-customlayers"]',
        title: 'Custom Layers Button',
        description: 'Open Custom Layers Panel. To start its onboarding: open the panel, then click the Tutorial play button in the panel header.',
        placement: 'right',
    },
    {
        selector: '[data-onboarding-target="left-sidebar-basemap"]',
        title: 'Basemap Button',
        description: 'Open Basemap Panel. To start its onboarding: open the panel, then click the Tutorial play button in the panel header.',
        placement: 'right',
    },
    {
        selector: '[data-onboarding-target="left-sidebar-changelog"]',
        title: 'Changelog Button',
        description: 'Open the What\'s New modal to review recent changes and feature additions.',
        placement: 'right',
    },
    {
        selector: '[data-onboarding-target="left-sidebar-general-onboarding"]',
        title: 'General Onboarding Button',
        description: 'To replay this general onboarding anytime: click this button, then press the Play button in the General Onboarding modal.',
        placement: 'right',
    },
];

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function getTooltipLayout(targetRect, preferredPlacement = 'right') {
    const width = 340;
    const height = 210;
    const gap = 16;
    const edge = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (!targetRect) {
        return {
            top: Math.round(vh / 2 - height / 2),
            left: Math.round(vw / 2 - width / 2),
            placement: 'top',
        };
    }

    const centerX = targetRect.left + targetRect.width / 2;
    const centerY = targetRect.top + targetRect.height / 2;
    const placements = [preferredPlacement, 'right', 'bottom', 'top', 'left'];

    for (const placement of placements) {
        if (placement === 'left') {
            const left = targetRect.left - width - gap;
            const top = clamp(centerY - height / 2, edge, vh - height - edge);
            if (left >= edge) return { top, left, placement };
        }
        if (placement === 'right') {
            const left = targetRect.right + gap;
            const top = clamp(centerY - height / 2, edge, vh - height - edge);
            if (left + width <= vw - edge) return { top, left, placement };
        }
        if (placement === 'top') {
            const top = targetRect.top - height - gap;
            const left = clamp(centerX - width / 2, edge, vw - width - edge);
            if (top >= edge) return { top, left, placement };
        }
        if (placement === 'bottom') {
            const top = targetRect.bottom + gap;
            const left = clamp(centerX - width / 2, edge, vw - width - edge);
            if (top + height <= vh - edge) return { top, left, placement };
        }
    }

    return {
        top: clamp(centerY - height / 2, edge, vh - height - edge),
        left: clamp(centerX - width / 2, edge, vw - width - edge),
        placement: 'top',
    };
}

function GeneralOnboarding({ isOpen, onClose }) {
    const [stepIndex, setStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState(null);
    const [steps, setSteps] = useState(STEP_DEFINITIONS);

    const activeStep = useMemo(() => steps[stepIndex] || steps[0], [steps, stepIndex]);

    const updateTargetRect = useCallback(() => {
        if (!isOpen || !activeStep) return;
        const target = document.querySelector(activeStep.selector);
        if (!target) {
            setTargetRect(null);
            return;
        }
        target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
        setTargetRect(target.getBoundingClientRect());
    }, [isOpen, activeStep]);

    const goPrev = useCallback(() => setStepIndex((prev) => Math.max(0, prev - 1)), []);
    const goNext = useCallback(() => {
        if (stepIndex >= steps.length - 1) {
            onClose?.();
            return;
        }
        setStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
    }, [stepIndex, steps.length, onClose]);

    useEffect(() => {
        if (!isOpen) return;
        const availableSteps = STEP_DEFINITIONS.filter((step) => document.querySelector(step.selector));
        setSteps(availableSteps.length > 0 ? availableSteps : STEP_DEFINITIONS);
        setStepIndex(0);
        setTargetRect(null);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        updateTargetRect();
        const timer = window.setTimeout(updateTargetRect, 350);
        window.addEventListener('resize', updateTargetRect);
        window.addEventListener('scroll', updateTargetRect, true);
        return () => {
            window.clearTimeout(timer);
            window.removeEventListener('resize', updateTargetRect);
            window.removeEventListener('scroll', updateTargetRect, true);
        };
    }, [isOpen, stepIndex, updateTargetRect]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event) => {
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                goPrev();
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                goNext();
            } else if (event.key === 'Escape') {
                event.preventDefault();
                onClose?.();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, goPrev, goNext, onClose]);

    if (!isOpen || !activeStep) return null;

    const tooltipLayout = getTooltipLayout(targetRect, activeStep.placement);

    return ReactDOM.createPortal(
        <div className="general-onboarding-overlay" role="dialog" aria-modal="true">
            <div className="general-onboarding-dim" />

            {targetRect && (
                <div
                    className="general-onboarding-highlight"
                    style={{
                        top: targetRect.top - 6,
                        left: targetRect.left - 6,
                        width: targetRect.width + 12,
                        height: targetRect.height + 12,
                    }}
                />
            )}

            <div
                className={`general-onboarding-tooltip placement-${tooltipLayout.placement}`}
                style={{ top: tooltipLayout.top, left: tooltipLayout.left }}
            >
                <div className="general-onboarding-progress">
                    Step {stepIndex + 1} of {steps.length}
                </div>
                <h4>{activeStep.title}</h4>
                <p>{activeStep.description}</p>
                <div className="general-onboarding-actions">
                    <button type="button" onClick={goPrev} disabled={stepIndex === 0}>
                        Previous
                    </button>
                    <button type="button" onClick={onClose}>Close</button>
                    <button type="button" className="primary" onClick={goNext}>
                        {stepIndex === steps.length - 1 ? 'Finish' : 'Next'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default GeneralOnboarding;
