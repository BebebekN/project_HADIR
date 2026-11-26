<style>
    /* HADIR (Project-PSAS) Filament Visual Theme */
    .fi-simple-layout {
        background: radial-gradient(circle at top left, #122b51 0%, #0f172a 52%, #004e54 100%) !important;
        min-height: 100vh;
    }

    .fi-simple-main {
        background: rgba(255, 255, 255, 0.97) !important;
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.25) !important;
        border-radius: 1.5rem !important;
        box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.45) !important;
    }

    .dark .fi-simple-main {
        background: rgba(15, 23, 42, 0.92) !important;
        border: 1px solid rgba(51, 65, 85, 0.7) !important;
    }

    .fi-sidebar {
        border-right: 1px solid rgba(226, 232, 240, 0.9);
    }

    .dark .fi-sidebar {
        border-right: 1px solid rgba(30, 41, 59, 0.9);
    }

    .fi-wi-stats-overview-stat,
    .fi-ta-ctn,
    .fi-section {
        border-radius: 1.125rem !important;
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05) !important;
    }

    .fi-btn-color-primary {
        background: linear-gradient(135deg, #122B51, #00C2B3) !important;
        border: none !important;
        box-shadow: 0 6px 16px rgba(0, 194, 179, 0.24) !important;
    }

    .fi-btn-color-primary:hover {
        filter: brightness(1.06);
    }

    /* Custom Page Layout Helpers for Daily QR & Rapor PKL */
    .psas-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }
    @media (min-width: 1024px) {
        .psas-grid {
            grid-template-columns: 2fr 1fr;
        }
    }
    .psas-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 1.25rem;
        padding: 1.75rem;
        box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
    }
    .dark .psas-card {
        background: #111827;
        border-color: #1f2937;
    }
    .psas-qr-frame {
        background: #ffffff;
        border: 3px solid #00C2B3;
        border-radius: 1.25rem;
        padding: 1.25rem;
        box-shadow: 0 12px 30px rgba(0, 194, 179, 0.16);
        display: inline-flex;
        justify-content: center;
        align-items: center;
    }
    .psas-qr-frame svg {
        width: 240px;
        height: 240px;
        display: block;
    }
    .psas-tip-card {
        background: linear-gradient(135deg, #122B51, #009B90);
        color: #ffffff;
        border-radius: 1.25rem;
        padding: 1.5rem;
        box-shadow: 0 10px 24px rgba(18, 43, 81, 0.22);
    }
    @media print {
        .fi-sidebar, .fi-topbar, .psas-no-print {
            display: none !important;
        }
        .fi-main {
            margin: 0 !important;
            padding: 0 !important;
        }
        .psas-print-doc {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
        }
    }
</style>
