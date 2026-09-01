import React, { useState } from "react";
import { createUseStyles } from "react-jss";
import AuthenticationStore from "../../../stores/authentication";

const useStyles = createUseStyles({
    wrapper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: '-3px',
    },
    followIcon: {
        display: 'block',
        width: '38px',
        height: '38px',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        marginBottom: '1px',
        cursor: 'pointer',
    },
    link: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: '#343434',
        fontSize: '11px',
        fontWeight: 500,
        textDecoration: 'none',
        '&:hover': {
            textDecoration: 'none',
            color: '#343434',
        }
    }
});

const Follow = props => {
    const s = useStyles();
    const auth = AuthenticationStore.useContainer();
    // Mock state for now as logic is deferred/unknown
    const [isFollowed, setIsFollowed] = useState(false);

    // If not authenticated, maybe don't show or redirect to login? 
    // For now, just render static.

    const toggleFollow = (e) => {
        e.preventDefault();
        setIsFollowed(!isFollowed);
        // TODO: Implement actual follow API call
    }

    return <div className={s.wrapper}>
        <a href="#" className={s.link} onClick={toggleFollow}>
            <div className={s.followIcon} style={{
                backgroundImage: isFollowed ? 'url("/img/games/following.png")' : 'url("/img/games/follow.png")'
            }} />
            <span>{isFollowed ? 'Unfollow' : 'Follow'}</span>
        </a>
    </div>
}

export default Follow;
