import React, { useState, useEffect, useCallback } from 'react';
import { createUseStyles } from 'react-jss';
import Theme2016 from '../components/theme2016';
import { getBaseUrl } from '../lib/request';
import Head from 'next/head';

const useStyles = createUseStyles({
    main: {
        minHeight: '95vh',
        paddingTop: '12px',
    },
    hero: {
        border: '1px solid #e0e0e0',
        padding: '26px 22px 22px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        textAlign: 'center',
        borderRadius: '4px',
        marginBottom: '20px',
        background: '#fff',
    },
    title: {
        color: '#2a2a2a',
        fontSize: '28px',
        fontWeight: 700,
        margin: '0 0 8px',
    },
    subTitle: {
        margin: '0 auto',
        fontSize: '14px',
        maxWidth: '640px',
        lineHeight: 1.6,
        color: '#555',
    },
    heroHighlights: {
        gap: '8px',
        display: 'flex',
        flexWrap: 'wrap',
        marginTop: '16px',
        justifyContent: 'center',
    },
    heroHighlight: {
        color: '#555',
        padding: '4px 10px',
        fontSize: '12px',
        fontWeight: 600,
        borderRadius: '3px',
        background: '#f2f2f2',
        border: '1px solid #ddd',
    },
    countdownBanner: {
        color: 'white',
        display: 'flex',
        padding: '16px 22px',
        background: '#c0392b',
        boxShadow: '0 2px 6px rgba(192, 57, 43, 0.4)',
        textAlign: 'center',
        alignItems: 'center',
        borderRadius: '4px',
        marginBottom: '20px',
        flexDirection: 'column',
    },
    countdownLabel: {
        margin: 0,
        opacity: 0.9,
        fontSize: '11px',
        fontWeight: 700,
        marginBottom: '4px',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
    },
    countdownTitle: {
        margin: 0,
        fontSize: '17px',
        fontWeight: 700,
        marginBottom: '12px',
    },
    countdownGrid: {
        gap: '8px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    countdownUnit: {
        padding: '8px 14px',
        minWidth: '64px',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '3px',
    },
    countdownValue: {
        margin: 0,
        fontSize: '24px',
        fontWeight: 700,
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
    },
    countdownUnitLabel: {
        margin: 0,
        opacity: 0.85,
        fontSize: '10px',
        marginTop: '4px',
        letterSpacing: '1px',
        textTransform: 'uppercase',
    },
    countdownNote: {
        margin: '10px 0 0',
        opacity: 0.9,
        fontSize: '12px',
    },
    grid: {
        gap: '14px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, max-content))',
        justifyContent: 'center',
        maxWidth: '960px',
        margin: '0 auto',
        '@media (max-width: 500px)': {
            gridTemplateColumns: '1fr',
        },
    },
    card: {
        color: 'inherit',
        display: 'flex',
        padding: '14px',
        border: '1px solid #ddd',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'box-shadow 150ms ease',
        alignItems: 'center',
        borderRadius: '4px',
        flexDirection: 'column',
        textDecoration: 'none',
        maxWidth: '220px',
        margin: '0 auto',
        width: '100%',
        background: '#fff',
        '&:hover': {
            color: 'inherit',
            boxShadow: '0 3px 8px rgba(0,0,0,0.12)',
            textDecoration: 'none',
        },
    },
    selectedCard: {
        border: '2px solid #5cb85c',
        padding: '13px',
        boxShadow: '0 3px 10px rgba(92, 184, 92, 0.25)',
    },
    thumbWrap: {
        width: '100%',
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
        alignItems: 'center',
        aspectRatio: '1 / 1',
        borderRadius: '3px',
        marginBottom: '10px',
        justifyContent: 'center',
        background: '#f2f2f2',
    },
    thumb: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
    },
    badgeContainer: {
        gap: '4px',
        top: '6px',
        right: '6px',
        display: 'flex',
        zIndex: 2,
        position: 'absolute',
    },
    badge: {
        color: '#fff',
        display: 'inline-flex',
        padding: '3px 6px',
        fontSize: '10px',
        alignItems: 'center',
        fontWeight: 600,
        lineHeight: '1em',
        borderRadius: '2px',
        backgroundColor: '#c0392b',
    },
    popularBadge: {
        backgroundColor: '#5cb85c',
    },
    amount: {
        color: '#2a2a2a',
        margin: 0,
        fontSize: '24px',
        fontWeight: 700,
        marginBottom: '2px',
    },
    itemName: {
        color: '#444',
        margin: '0 0 4px',
        fontSize: '13px',
        minHeight: '20px',
        textAlign: 'center',
        fontWeight: 600,
    },
    robuxRow: {
        gap: '4px',
        margin: 0,
        display: 'inline-flex',
        flexWrap: 'wrap',
        fontSize: '13px',
        alignItems: 'center',
        fontWeight: 600,
        color: '#555',
        marginBottom: '10px',
        justifyContent: 'center',
    },
    robuxIcon: {
        width: 'auto',
        height: '12px',
        verticalAlign: 'middle',
    },
    ctaRow: {
        color: 'white',
        width: '100%',
        border: 'none',
        cursor: 'pointer',
        padding: '7px 0',
        fontSize: '13px',
        background: '#5cb85c',
        marginTop: 'auto',
        textAlign: 'center',
        fontFamily: 'inherit',
        fontWeight: 600,
        borderRadius: '3px',
        '&:hover': {
            background: '#4cae4c',
        },
    },
    selectedCta: {
        background: '#449d44',
    },
    bundleTag: {
        color: 'white',
        display: 'inline-flex',
        padding: '2px 7px',
        fontSize: '10px',
        background: '#5cb85c',
        fontWeight: 700,
        marginLeft: '3px',
        borderRadius: '2px',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
    },
    section: {
        marginTop: '32px',
    },
    sectionTitle: {
        color: '#2a2a2a',
        fontSize: '18px',
        fontWeight: 700,
        borderBottom: '1px solid #ddd',
        marginBottom: '12px',
        paddingBottom: '6px',
    },
    stepsGrid: {
        gap: '12px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        '@media (max-width: 767px)': {
            gridTemplateColumns: '1fr',
        },
    },
    stepCard: {
        padding: '14px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        background: '#fff',
    },
    stepNumber: {
        color: 'white',
        width: '24px',
        height: '24px',
        display: 'inline-flex',
        fontSize: '12px',
        background: '#5cb85c',
        alignItems: 'center',
        fontWeight: 700,
        borderRadius: '50%',
        marginBottom: '8px',
        justifyContent: 'center',
    },
    stepTitle: {
        color: '#2a2a2a',
        margin: '0 0 4px',
        fontSize: '14px',
        fontWeight: 700,
    },
    stepText: {
        margin: 0,
        fontSize: '13px',
        lineHeight: 1.5,
        color: '#666',
    },
    perksBox: {
        color: '#444',
        padding: '16px 20px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        background: '#fff',
    },
    perkItem: {
        display: 'flex',
        alignItems: 'flex-start',
        marginBottom: '10px',
        '&:lastChild': {
            marginBottom: 0,
        },
    },
    perkBadge: {
        color: 'white',
        display: 'inline-block',
        padding: '2px 8px',
        fontSize: '11px',
        background: '#5cb85c',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        marginRight: '10px',
        borderRadius: '3px',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
    },
    perkText: {
        margin: 0,
        fontSize: '13px',
        lineHeight: 1.5,
    },
    selectionBox: {
        border: '1px solid #ddd',
        padding: '14px 16px',
        borderRadius: '4px',
        marginBottom: '12px',
        background: '#f9f9f9',
    },
    selectionTitle: {
        color: '#2a2a2a',
        margin: '0 0 4px',
        fontSize: '15px',
        fontWeight: 700,
    },
    selectionText: {
        margin: 0,
        fontSize: '13px',
        color: '#555',
    },
    displayNameNotice: {
        color: '#555',
        border: '1px solid #ddd',
        margin: '10px 0 0',
        padding: '10px 12px',
        fontSize: '13px',
        lineHeight: 1.5,
        borderRadius: '3px',
        background: '#fff',
    },
    rewarbleGrid: {
        gap: '14px',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 380px)',
        '@media (max-width: 900px)': {
            gridTemplateColumns: '1fr',
        },
    },
    tutorialCard: {
        color: '#444',
        padding: '14px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        background: '#fff',
    },
    tutorialList: {
        margin: 0,
        fontSize: '13px',
        lineHeight: 1.6,
        paddingLeft: '18px',
        '& li': {
            marginBottom: '6px',
        },
    },
    tutorialLinks: {
        gap: '10px',
        display: 'flex',
        marginTop: '14px',
        flexDirection: 'column',
    },
    vendorSource: {
        gap: '4px',
        display: 'flex',
        flexDirection: 'column',
    },
    vendorTitle: {
        color: '#2a2a2a',
        margin: 0,
        fontSize: '13px',
        fontWeight: 700,
    },
    vendorNote: {
        color: '#999',
        margin: 0,
        fontSize: '12px',
        fontWeight: 600,
    },
    vendorLinkList: {
        gap: '4px',
        display: 'flex',
        alignItems: 'flex-start',
        flexDirection: 'column',
    },
    tutorialLink: {
        color: '#5cb85c',
        fontSize: '13px',
        fontWeight: 600,
        textDecoration: 'none',
        '&:hover': {
            color: '#4cae4c',
            textDecoration: 'underline',
        },
    },
    redeemCard: {
        color: '#444',
        padding: '14px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        background: '#fff',
    },
    redeemLabel: {
        color: '#2a2a2a',
        display: 'block',
        fontSize: '13px',
        fontWeight: 700,
        marginBottom: '6px',
    },
    voucherInput: {
        color: '#2a2a2a',
        width: '100%',
        border: '1px solid #ccc',
        height: '38px',
        outline: 0,
        padding: '0 10px',
        fontSize: '14px',
        fontWeight: 600,
        borderRadius: '3px',
        letterSpacing: '0.8px',
        textTransform: 'uppercase',
        background: '#fff',
        '&:focus': {
            borderColor: '#5cb85c',
            boxShadow: '0 0 0 2px rgba(92,184,92,0.15)',
        },
    },
    redeemHint: {
        color: '#999',
        margin: '6px 0 0',
        fontSize: '12px',
        lineHeight: 1.4,
    },
    redeemButton: {
        color: '#fff',
        width: '100%',
        border: 0,
        cursor: 'pointer',
        fontSize: '14px',
        background: '#5cb85c',
        marginTop: '10px',
        minHeight: '36px',
        fontWeight: 700,
        borderRadius: '3px',
        '&:hover': {
            background: '#4cae4c',
        },
        '&:disabled': {
            cursor: 'not-allowed',
            opacity: 0.5,
        },
    },
    redeemResult: {
        padding: '10px 12px',
        fontSize: '13px',
        marginTop: '10px',
        lineHeight: 1.45,
        borderRadius: '3px',
    },
    redeemSuccess: {
        border: '1px solid #b2dba1',
        background: '#dff0d8',
        color: '#3c763d',
    },
    redeemError: {
        border: '1px solid #ebccd1',
        background: '#f2dede',
        color: '#a94442',
    },
    resultTitle: {
        margin: '0 0 3px',
        fontWeight: 700,
    },
    resultText: {
        margin: 0,
    },
    cryptoGrid: {
        gap: '12px',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        '@media (max-width: 767px)': {
            gridTemplateColumns: '1fr',
        },
    },
    cryptoCard: {
        display: 'flex',
        padding: '14px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        flexDirection: 'column',
        background: '#fff',
    },
    cryptoName: {
        color: '#2a2a2a',
        margin: 0,
        fontSize: '15px',
        fontWeight: 600,
        marginBottom: '8px',
    },
    cryptoTicker: {
        fontSize: '12px',
        fontWeight: 400,
        color: '#999',
        marginLeft: '5px',
    },
    cryptoAddress: {
        width: '100%',
        border: '1px solid #ddd',
        cursor: 'pointer',
        padding: '7px 10px',
        fontSize: '12px',
        textAlign: 'left',
        transition: 'border-color 150ms ease',
        wordBreak: 'break-all',
        fontFamily: 'monospace',
        userSelect: 'none',
        borderRadius: '3px',
        background: '#f9f9f9',
        color: '#444',
        '&:hover': {
            borderColor: '#5cb85c',
        },
    },
    cryptoAddressCopied: {
        color: 'white',
        width: '100%',
        border: '1px solid transparent',
        cursor: 'pointer',
        padding: '7px 10px',
        fontSize: '12px',
        background: '#5cb85c',
        fontStyle: 'italic',
        textAlign: 'center',
        wordBreak: 'break-all',
        fontFamily: 'monospace',
        userSelect: 'none',
        borderRadius: '3px',
    },
    disclaimer: {
        color: '#c0392b',
        fontSize: '14px',
        marginTop: '24px',
        textAlign: 'center',
        fontWeight: 700,
    },
    claimBox: {
        border: '1px solid #ddd',
        padding: '14px 18px',
        marginTop: '24px',
        textAlign: 'center',
        borderRadius: '4px',
        background: '#f9f9f9',
    },
    claimTitle: {
        color: '#2a2a2a',
        margin: '0 0 6px',
        fontSize: '16px',
        fontWeight: 700,
    },
    claimText: {
        margin: '3px 0',
        fontSize: '13px',
        lineHeight: 1.5,
        color: '#666',
    },
});

function getTimeRemaining(endDate) {
    const total = Date.parse(endDate) - Date.now();
    if (total <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
        days: Math.floor(total / (1000 * 60 * 60 * 24)),
        hours: Math.floor((total / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((total / (1000 * 60)) % 60),
        seconds: Math.floor((total / 1000) % 60),
    };
}

const CRYPTO_ADDRESSES = [
    { name: 'Ethereum', ticker: 'ETH', address: '0x7EC621ac86D6B3749B4B5eF982Dc1629034cb966' },
    { name: 'Bitcoin', ticker: 'BTC', address: 'bc1qmxsnfkkd2k2vv08t9fqtlmp0dmjaygaq8pqthd' },
    { name: 'Litecoin', ticker: 'LTC', address: 'LWabPt73PWyxamfotrVgG183RoLEPMH8SF' },
    { name: 'Solana', ticker: 'SOL', address: 'HBaSr8MKTtuQsbDfR274nqF78Kk4mKjqJ9jpvrJFugt7' },
];

const DEFAULT_END_DATE = new Date('2026-08-01T00:00:00');

function formatTier(raw) {
    return {
        id: raw.id,
        price: raw.price_usd,
        name: raw.name,
        robux: raw.robux,
        image: `/thumbs/asset.ashx?assetId=${raw.asset_id}&width=200&height=200`,
        assetId: raw.asset_id,
        includesAll: raw.includes_all_items,
    };
}

export default function DonatePage() {
    const s = useStyles();
    const [tiers, setTiers] = useState([]);
    const [tiersLoading, setTiersLoading] = useState(true);
    const [selectedTier, setSelectedTier] = useState(null);
    const [countdownEnabled, setCountdownEnabled] = useState(true);
    const [endDate, setEndDate] = useState(DEFAULT_END_DATE);
    const [countdown, setCountdown] = useState(() => getTimeRemaining(DEFAULT_END_DATE));
    const [copiedAddress, setCopiedAddress] = useState(null);
    const [voucherCode, setVoucherCode] = useState('');
    const [redeeming, setRedeeming] = useState(false);
    const [redeemResult, setRedeemResult] = useState(null);

    useEffect(() => {
        fetch(`${getBaseUrl()}donate/settings`)
            .then(r => r.json())
            .then(data => {
                setCountdownEnabled(data.countdown_enabled ?? true);
                if (data.countdown_end_date) {
                    const d = new Date(data.countdown_end_date);
                    setEndDate(d);
                    setCountdown(getTimeRemaining(d));
                }
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(getTimeRemaining(endDate));
        }, 1000);
        return () => clearInterval(timer);
    }, [endDate]);

    useEffect(() => {
        fetch(`${getBaseUrl()}donate/tiers`)
            .then(r => r.json())
            .then(data => {
                const parsed = (Array.isArray(data) ? data : []).map(formatTier);
                setTiers(parsed);
                if (parsed.length > 0) setSelectedTier(parsed[0].price);
                setTiersLoading(false);
            })
            .catch(() => setTiersLoading(false));
    }, []);

    const handleCopyAddress = useCallback((address, index) => {
        navigator.clipboard.writeText(address).then(() => {
            setCopiedAddress(index);
            setTimeout(() => setCopiedAddress(null), 2000);
        }).catch(() => {});
    }, []);

    const handleRedeem = async (e) => {
        e.preventDefault();
        if (!voucherCode || voucherCode.length < 16 || redeeming) return;
        setRedeeming(true);
        setRedeemResult(null);
        try {
            const res = await fetch(`${getBaseUrl()}donate/redeem`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: voucherCode.toUpperCase() }),
            });
            const data = await res.json();
            if (res.ok) {
                setRedeemResult({ success: true, message: data.message || 'Voucher redeemed successfully!' });
            } else {
                setRedeemResult({ success: false, message: data.message || data.errors?.[0]?.message || 'Redemption failed.' });
            }
        } catch (err) {
            setRedeemResult({ success: false, message: 'An error occurred. Please try again later.' });
        } finally {
            setRedeeming(false);
        }
    };

    const selected = tiers.find(t => t.price === selectedTier) || tiers[0] || { price: 0, name: 'Loading...', robux: 0 };

    return (
        <Theme2016>
            <Head>
                <title>Donate - Athera</title>
            </Head>
            <div className="container-fluid p-0">
                <div className={s.main}>
                    <div className="container" style={{ paddingTop: 20, paddingBottom: 40 }}>

                        {countdownEnabled && (
                        <div className={s.countdownBanner}>
                            <p className={s.countdownLabel}>Leaving Soon</p>
                            <p className={s.countdownTitle}>These donation items disappear on {endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                            <div className={s.countdownGrid}>
                                {[
                                    { val: countdown.days, label: 'Days' },
                                    { val: countdown.hours, label: 'Hours' },
                                    { val: countdown.minutes, label: 'Minutes' },
                                    { val: countdown.seconds, label: 'Seconds' },
                                ].map(({ val, label }) => (
                                    <div key={label} className={s.countdownUnit}>
                                        <p className={s.countdownValue}>{String(val).padStart(2, '0')}</p>
                                        <p className={s.countdownUnitLabel}>{label}</p>
                                    </div>
                                ))}
                            </div>
                            <p className={s.countdownNote}>Claim your reward before this limited collection retires.</p>
                        </div>
                        )}

                        <div className={s.hero}>
                            <h1 className={s.title}>Support Athera</h1>
                            <p className={s.subTitle}>
                                Athera is a non-profit project run by the community, for the community.
                                Every dollar goes straight into better hosting and infrastructure &mdash; nothing else.
                                We publish a live breakdown of every cent received and spent in our Discord server.
                            </p>
                            <p className={s.subTitle} style={{ marginTop: 8 }}>
                                Pick a tier below to donate and receive a limited in-game item as our thank-you.
                            </p>
                            <div className={s.heroHighlights}>
                                <span className={s.heroHighlight}>Limited on-site rewards</span>
                                <span className={s.heroHighlight}>Permanent Discord role</span>
                                <span className={s.heroHighlight}>Transparent community funding</span>
                            </div>
                        </div>

                        <div className={s.grid}>
                            {tiersLoading ? (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: '#999' }}>
                                    Loading tiers...
                                </div>
                            ) : tiers.length === 0 ? (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: '#999' }}>
                                    No donation tiers available right now.
                                </div>
                            ) : tiers.map((tier) => {
                                const isSelected = selectedTier === tier.price;
                                return (
                                    <div key={tier.id} className={`${s.card} ${isSelected ? s.selectedCard : ''}`}>
                                        <a href={`https://athera.sbs/catalog/${tier.assetId}/Donate`} target="_blank" rel="noopener noreferrer" className={s.thumbWrap}>
                                            <div className={s.badgeContainer}>
                                                {tier.includesAll && <span className={`${s.badge} ${s.popularBadge}`}>Best Value</span>}
                                                <span className={s.badge}>New</span>
                                            </div>
                                            <img src={tier.image} alt={`$${tier.price} donation item`} className={s.thumb} />
                                        </a>
                                        <p className={s.itemName}>{tier.name}</p>
                                        <p className={s.amount}>${tier.price}</p>
                                        <p className={s.robuxRow}>
                                            +{tier.robux.toLocaleString()}
                                            <img src="/img/img-robux.png" alt="Robux" className={s.robuxIcon} />
                                            {tier.includesAll && <span className={s.bundleTag}>+ all items</span>}
                                        </p>
                                        <button
                                            type="button"
                                            className={`${s.ctaRow} ${isSelected ? s.selectedCta : ''}`}
                                            onClick={() => setSelectedTier(tier.price)}
                                        >
                                            {isSelected ? 'Selected' : `Choose $${tier.price}`}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <div className={s.section}>
                            <h2 className={s.sectionTitle}>How It Works</h2>
                            <div className={s.stepsGrid}>
                                <div className={s.stepCard}>
                                    <span className={s.stepNumber}>1</span>
                                    <p className={s.stepTitle}>Choose a tier</p>
                                    <p className={s.stepText}>Pick the reward you want. The highest tier includes the full collection.</p>
                                </div>
                                <div className={s.stepCard}>
                                    <span className={s.stepNumber}>2</span>
                                    <p className={s.stepTitle}>Donate &amp; open a ticket</p>
                                    <p className={s.stepText}>Donate the matching USD amount and open a ticket on Discord with proof to receive your voucher code.</p>
                                </div>
                                <div className={s.stepCard}>
                                    <span className={s.stepNumber}>3</span>
                                    <p className={s.stepTitle}>Claim your rewards</p>
                                    <p className={s.stepText}>Log in, paste your voucher code below, and rewards are granted to your account automatically.</p>
                                </div>
                            </div>
                        </div>

                        <div className={s.section}>
                            <h2 className={s.sectionTitle}>Perks</h2>
                            <div className={s.perksBox}>
                                <div className={s.perkItem}>
                                    <span className={s.perkBadge}>Item</span>
                                    <p className={s.perkText}>Voucher redemption grants the matching on-site item and Robux reward for your tier.</p>
                                </div>
                                <div className={s.perkItem}>
                                    <span className={s.perkBadge}>Discord</span>
                                    <p className={s.perkText}>Get the <strong>Donator</strong> role in the Athera Discord server permanently.</p>
                                </div>
                            </div>
                        </div>

                        <div className={s.section} id="payment-methods">
                            <h2 className={s.sectionTitle}>Redeem a Voucher</h2>
                            <div className={s.selectionBox}>
                                <p className={s.selectionTitle}>
                                    Selected tier: ${selected.price} &mdash; {selected.name}
                                </p>
                                <p className={s.selectionText}>
                                    Includes the matching limited item, {selected.robux ? selected.robux.toLocaleString() : 0} Robux, and the permanent Discord Donator role.
                                </p>
                                <p className={s.displayNameNotice}>
                                    Donate <strong>${selected.price} USD</strong>, then open a ticket on Discord with proof to receive your code. Redeem it here while logged in &mdash; rewards go to the account currently signed in.
                                </p>
                            </div>

                            <div className={s.rewarbleGrid}>
                                <div className={s.tutorialCard}>
                                    <ol className={s.tutorialList}>
                                        <li>Choose the tier you want above.</li>
                                        <li>Use one of the links below to donate the matching USD amount.</li>
                                        <li>Open a ticket on our Discord with donation proof to receive your voucher code.</li>
                                        <li>Return here while logged into the Athera account that should receive the rewards.</li>
                                        <li>Paste the code into the box and hit Redeem.</li>
                                        <li>Need help? Join <a className={s.tutorialLink} href="https://discord.gg/athera" target="_blank" rel="noopener noreferrer">discord.gg/athera</a></li>
                                    </ol>
                                    <div className={s.tutorialLinks}>
                                        <div className={s.vendorSource}>
                                            <p className={s.vendorTitle}>Donation Links</p>
                                            <p className={s.vendorNote}>PayPal &amp; Card accepted</p>
                                            <div className={s.vendorLinkList}>
                                                <a className={s.tutorialLink} href="https://ko-fi.com/atherarev" target="_blank" rel="noopener noreferrer">Ko-fi Donation (show proof in ticket)</a>
                                                <a className={s.tutorialLink} href="https://datalix.eu/cp/donate/celestiadonation" target="_blank" rel="noopener noreferrer">VPS Provider Donation (show proof in ticket)</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <form className={s.redeemCard} onSubmit={handleRedeem}>
                                    <label className={s.redeemLabel} htmlFor="voucher-code">Voucher code</label>
                                    <input
                                        id="voucher-code"
                                        className={s.voucherInput}
                                        value={voucherCode}
                                        onChange={(e) => setVoucherCode(e.target.value)}
                                        placeholder="PASTE VOUCHER CODE"
                                        autoComplete="off"
                                    />
                                    <p className={s.redeemHint}>Codes must be at least 16 characters and are uppercased automatically.</p>
                                    <button type="submit" className={s.redeemButton} disabled={redeeming || !voucherCode || voucherCode.length < 16}>
                                        {redeeming ? 'Redeeming...' : 'Redeem Voucher'}
                                    </button>
                                    {redeemResult && (
                                        <div className={`${s.redeemResult} ${redeemResult.success ? s.redeemSuccess : s.redeemError}`}>
                                            <p className={s.resultTitle}>{redeemResult.success ? 'Success' : 'Error'}</p>
                                            <p className={s.resultText}>{redeemResult.message}</p>
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>

                        <div className={s.section}>
                            <h2 className={s.sectionTitle}>Cryptocurrency</h2>
                            <div className={s.cryptoGrid}>
                                {CRYPTO_ADDRESSES.map((crypto, i) => (
                                    <div key={crypto.ticker} className={s.cryptoCard}>
                                        <p className={s.cryptoName}>{crypto.name}<span className={s.cryptoTicker}>{crypto.ticker}</span></p>
                                        <button
                                            type="button"
                                            className={copiedAddress === i ? s.cryptoAddressCopied : s.cryptoAddress}
                                            title="Copy address"
                                            onClick={() => handleCopyAddress(crypto.address, i)}
                                        >
                                            {copiedAddress === i ? 'Copied!' : crypto.address}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <p className={s.disclaimer}>Donations are final and non-refundable.</p>

                        <div className={s.claimBox}>
                            <p className={s.claimTitle}>Need help?</p>
                            <p className={s.claimText}>Join <a className={s.tutorialLink} href="https://discord.gg/athera" target="_blank" rel="noopener noreferrer">discord.gg/athera</a> and open a support ticket.</p>
                            <p className={s.claimText}>Vouchers grant on-site items and Robux automatically when redeemed by a logged-in Athera account.</p>
                            <p className={s.claimText}>Claims are usually instant, but please allow up to 24 hours.</p>
                        </div>

                    </div>
                </div>
            </div>
        </Theme2016>
    );
}

export const getStaticProps = () => {
    return {
        props: {
            title: 'Donate - Athera',
        },
    };
};