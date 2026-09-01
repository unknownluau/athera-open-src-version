import React, { useState } from "react";
import { createUseStyles } from "react-jss";
import { createPlace } from "../../services/develop";

const useStyles = createUseStyles({
    container: {
        backgroundColor: '#fff',
        padding: '20px',
        marginTop: '40px',
        borderRadius: '4px',
        border: '1px solid #c3c3c3',
    },
    title: {
        fontSize: '24px',
        fontWeight: 700,
        marginBottom: '20px',
    },
    successText: {
        color: '#39b54a',
        fontWeight: 700,
    },
    errorText: {
        color: '#f44336',
        marginTop: '10px',
    }
});

const CreatePlacePage = () => {
    const classes = useStyles();
    const [loading, setLoading] = useState(false);
    const [successUrl, setSuccessUrl] = useState(null);
    const [error, setError] = useState(null);

    const handleCreatePlace = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const result = await createPlace();
            setSuccessUrl(`/places/${result.data.placeId}/update`);
        } catch (err) {
            setError(err.message || 'An error occurred while creating the place.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="row">
                <div className="col-12 col-lg-6 offset-lg-3">
                    <div className={classes.container}>
                        <h3 className={classes.title}>Create a Place</h3>
                        {successUrl ? (
                            <div className="mt-4 mb-4">
                                <p><span className={classes.successText}>Place created successfully.</span> To upload your game, click <a href={successUrl}>here</a>. You should bookmark the upload URL since it is not visible elsewhere.</p>
                            </div>
                        ) : (
                            <>
                                <p>Welcome to the place creation menu. Places are where games happen, and you need a place to make a game. By clicking "Create Place" below, you agree to create a place for use in a future game.</p>
                                <p>Requirements:</p>
                                <ul>
                                    <li>You must follow the Terms of Use and Community Guidelines.</li>
                                </ul>
                                {error && <p className={classes.errorText}>{error}</p>}
                                <form onSubmit={handleCreatePlace}>
                                    <button
                                        type="submit"
                                        className="btn btn-success ps-4 pe-4 pt-2 pb-2"
                                        style={{ fontSize: '18px', fontWeight: 600 }}
                                        disabled={loading}
                                    >
                                        {loading ? 'Creating...' : 'Create Place'}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreatePlacePage;
