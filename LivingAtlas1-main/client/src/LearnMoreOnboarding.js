import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import './CardPanelOnboarding.css';

const LEARN_MORE_STEPS = [
    {
        selector: '[data-onboarding-target="learn-more-toolbar"]',
        title: 'Top Toolbar',
        description: 'This toolbar contains actions to edit, export, delete, open help, start onboarding, and close the Detail View.',
        placement: 'bottom',
    },
    {
        selector: '[data-onboarding-target="learn-more-text-area"]',
        title: 'Text and Data Area',
        description: 'This section displays card fields and editable content, including coordinates or polygon settings and linked ArcGIS services.',
        placement: 'left',
    },
    {
        selector: '[data-onboarding-target="learn-more-image-area"]',
        title: 'Image Area',
        description: 'In edit mode, click image slots to add images. You can also click "See n images" to enter the all-images screen for bulk management.',
        placement: 'left',
    },
];

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function getTooltipLayout(targetRect, preferredPlacement = 'left') {
    const width = 320;
    const height = 190;
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
    const placements = [preferredPlacement, 'left', 'bottom', 'top', 'right'];

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

function LearnMoreOnboarding({ isOpen, onClose, isModalOpen }) {
    const [stepIndex, setStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState(null);

    const activeStep = useMemo(() => LEARN_MORE_STEPS[stepIndex] || LEARN_MORE_STEPS[0], [stepIndex]);

    const updateTargetRect = useCallback(() => {
        if (!isOpen) return;
        const target = document.querySelector(activeStep.selector);
        if (!target) {
            setTargetRect(null);
            return;
        }
        setTargetRect(target.getBoundingClientRect());
    }, [isOpen, activeStep]);

    useEffect(() => {
        if (!isOpen) return;
        setStepIndex(0);
        setTargetRect(null);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        if (!isModalOpen) onClose?.();
    }, [isOpen, isModalOpen, onClose]);

    useEffect(() => {
        if (!isOpen) return;
        updateTargetRect();
        window.addEventListener('resize', updateTargetRect);
        window.addEventListener('scroll', updateTargetRect, true);
        return () => {
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
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const tooltipLayout = getTooltipLayout(targetRect, activeStep.placement);

    const goPrev = () => setStepIndex((prev) => Math.max(0, prev - 1));
    const goNext = () => {
        if (stepIndex >= LEARN_MORE_STEPS.length - 1) {
            onClose?.();
            return;
        }
        setStepIndex((prev) => Math.min(LEARN_MORE_STEPS.length - 1, prev + 1));
    };

    return ReactDOM.createPortal(
        <div className="card-onboarding-overlay" role="dialog" aria-modal="true">
            <div className="card-onboarding-dim" />

            {targetRect && (
                <div
                    className="card-onboarding-highlight"
                    style={{
                        top: targetRect.top - 6,
                        left: targetRect.left - 6,
                        width: targetRect.width + 12,
                        height: targetRect.height + 12,
                    }}
                />
            )}

            <div
                className={`card-onboarding-tooltip placement-${tooltipLayout.placement}`}
                style={{ top: tooltipLayout.top, left: tooltipLayout.left }}
            >
                <div className="card-onboarding-progress">
                    Step {stepIndex + 1} of {LEARN_MORE_STEPS.length}
                </div>
                <h4>{activeStep.title}</h4>
                <p>{activeStep.description}</p>
                <div className="card-onboarding-actions">
                    <button type="button" onClick={goPrev} disabled={stepIndex === 0}>Previous</button>
                    <button type="button" onClick={onClose}>Close</button>
                    <button type="button" className="primary" onClick={goNext}>
                        {stepIndex === LEARN_MORE_STEPS.length - 1 ? 'Finish' : 'Next'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default LearnMoreOnboarding;
