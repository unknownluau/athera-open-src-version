import React, { useState } from 'react';
import { createUseStyles } from 'react-jss';
import Theme2016 from '../components/theme2016';
import useButtonStyles from '../styles/buttonStyles';
import request, { getBaseUrl } from '../lib/request';
import ItemImage from '../components/itemImage';

const useStyles = createUseStyles({
    title: {
        fontWeight: 700,
        fontSize: '32px',
        marginBottom: '20px',
        color: '#343434',
    },
    subTitle: {
        fontWeight: 700,
        fontSize: '18px',
        marginTop: '10px',
        marginBottom: '10px',
        color: '#000',
    },
    description: {
        fontSize: '14px',
        color: '#343434',
        lineHeight: '1.5',
        marginBottom: '20px',
    },
    cardTitle: {
        fontWeight: 700,
        fontSize: '16px',
        marginBottom: '10px',
        textAlign: 'left',
        color: '#000',
    },
    inputWrapper: {
        display: 'flex',
        gap: '5px',
        marginTop: '10px',
        alignItems: 'center',
    },
    resultMessage: {
        marginTop: '25px',
        textAlign: 'left',
    },
    redeemCard: {
        padding: '0 25px',
    },
    whiteBox: {
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 4px 0 rgba(25, 25, 25, 0.3)',
        padding: '25px',
        color: '#000',
        minHeight: '90vh',
    },
    redeemButton: {
        background: '#02b75a',
        border: '1px solid #02b75a',
        borderRadius: '3px',
        fontWeight: '500',
        color: '#fff!important',
        fontSize: '16px',
        padding: '6px 15px',
        cursor: 'pointer',
        height: '38px',
        '&:hover': {
            background: '#029d4d',
            borderColor: '#029d4d',
        },
        '&:disabled': {
            background: '#a3e2bd',
            borderColor: '#a3e2bd',
            color: 'rgba(255, 255, 255, 0.8)!important',
            cursor: 'not-allowed',
        }
    },
    verticalDivider: {
        borderRight: '1px solid #e3e3e3',
    },
    successBox: {
        background: '#f4fff4',
        border: '1px solid #c9ffc9',
        padding: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        borderRadius: '3px',
    },
    successText: {
        color: '#02b75a',
        fontWeight: 600,
        fontSize: '16px',
    },
    errorBox: {
        background: '#fff4f4',
        border: '1px solid #ffc9c9',
        padding: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        borderRadius: '3px',
    },
    errorText: {
        color: '#d86868',
        fontWeight: 600,
        fontSize: '16px',
    },
    receivedTitle: {
        fontSize: '16px',
        fontWeight: 700,
        marginTop: '20px',
    },
    receivedItemCard: {
        border: '1px solid #c3c3c3',
        borderRadius: '3px',
        padding: '10px',
        marginTop: '10px',
        maxWidth: '150px',
        textAlign: 'center',
        background: '#fff',
    },
    receivedItemName: {
        fontSize: '13px',
        fontWeight: 700,
        marginTop: '5px',
        display: 'block',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    successIcon: {
        width: '60px', // Increased size
        height: '60px', // Increased size
        backgroundImage: 'url("/img/thumbs/thumbsup.png")',
        backgroundSize: 'contain', // Ensures the whole icon fits
        backgroundPosition: 'center', // Centers the icon
        backgroundRepeat: 'no-repeat',
        display: 'inline-block',
    },
    errorIcon: {
        width: '60px', // Increased size
        height: '60px', // Increased size
        backgroundImage: 'url("/img/thumbs/thumbsdown.png")',
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'inline-block',
    },
    robuxIcon: {
        width: '40px',
        height: '40px',
        margin: '0 auto',
        backgroundImage: 'url("/img/img-robux.png")',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        display: 'block',
    },
    inputField: {
        maxWidth: '220px',
    }
});

export default function PromocodesPage() {
    const s = useStyles();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleRedeem = async (e) => {
        e.preventDefault();
        if (!code || loading) return;

        setLoading(true);
        setResult(null);

        try {
            const url = `${getBaseUrl()}promocodes/redeem?code=${encodeURIComponent(code)}`;
            const response = await request('GET', url);
            setResult({ success: true, ...response.data });
        } catch (e) {
            let message = 'An error occurred. Please try again later.';
            if (e.response && e.response.data && e.response.data.errors) {
                message = e.response.data.errors[0].message;
            } else if (e.message) {
                message = e.message;
            }

            // If the message contains a newline (stack trace), take only the first line
            if (message && message.includes('\n')) {
                message = message.split('\n')[0];
            }

            setResult({ success: false, message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Theme2016>
            <div className="container-fluid p-0">
                <div className={s.whiteBox}>
                    <div className="container">
                        <h1 className={s.title}>Redeem Athera Promotions</h1>
                        <div className="row">
                            <div className={`col-12 col-lg-7 ${s.verticalDivider}`}>
                                <h2 className={s.subTitle}>How do I get a Athera promotional code?</h2>
                                <p className={s.description}>
                                    You may receive a Athera promo code from one of our many events or giveaways. Valid codes will earn you a virtual good that will be added to your Athera account.
                                </p>

                                <h2 className={s.subTitle}>How do I use my promotional code?</h2>
                                <p className={s.description}>
                                    This is the place to claim your goods. Enter the promo code in the section to the right and your free virtual good will be automatically added to your Athera account. Remember that promo codes may expire or only be active for a short period of time, so make sure to use your code right away.
                                </p>
                            </div>
                            <div className="col-12 col-lg-5">
                                <div className={s.redeemCard}>
                                    <div className={s.cardTitle}>Enter Your Code:</div>
                                    <form onSubmit={handleRedeem}>
                                        <div className={s.inputWrapper}>
                                            <input
                                                type="text"
                                                className={`inputTextStyle ${s.inputField}`}
                                                placeholder="Enter code"
                                                value={code}
                                                onChange={(e) => setCode(e.target.value)}
                                                disabled={loading}
                                            />
                                            <button
                                                type="submit"
                                                className={s.redeemButton}
                                                disabled={loading || !code}
                                            >
                                                {loading ? '...' : 'Redeem'}
                                            </button>
                                        </div>
                                    </form>

                                    {result && (
                                        <div className={s.resultMessage}>
                                            {result.success ? (
                                                <>
                                                    <div className={s.successBox}>
                                                        <div className={s.successIcon} title="Success" />
                                                        <span className={s.successText}>Promo code successfully redeemed!</span>
                                                    </div>

                                                    {(result.assetId || result.robux) && (
                                                        <div className={s.receivedTitle}>You received:</div>
                                                    )}

                                                    {result.assetId && (
                                                        <div className={s.receivedItemCard}>
                                                            <a href={`/catalog/${result.assetId}/--`}>
                                                                <ItemImage id={result.assetId} name={result.name} />
                                                            </a>
                                                            <span className={s.receivedItemName}>{result.name || 'Unknown Item'}</span>
                                                        </div>
                                                    )}

                                                    {result.robux && result.robux > 0 && (
                                                        <div className={s.receivedItemCard}>
                                                            <div className={s.robuxIcon} title="Robux" />
                                                            <span className={s.receivedItemName}>{result.robux.toLocaleString()} Robux</span>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className={s.errorBox}>
                                                    <div className={s.errorIcon} title="Error" />
                                                    <span className={s.errorText}>{result.message}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
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
            title: 'Promocodes - Athera',
        },
    }
}
