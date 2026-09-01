import { createUseStyles } from "react-jss";

const useRobuxStyles = createUseStyles({
  image: {
    width: '18px',
    height: '18px',
    objectFit: 'contain',
    display: 'inline-block',
    verticalAlign: 'text-bottom',
  },
  prefix: {
    display: 'inline-block',
    paddingRight: '2px',
    fontSize: '14px',
  },
  amount: {
    display: 'inline-block',
    paddingLeft: '2px',
    fontSize: '16px',
    color: '#02b757',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
});

const Robux = props => {
  const s = useRobuxStyles();
  let children = props.children;
  if (typeof children === 'number') {
    children = children.toLocaleString();
  }

  if (props.inline) {
    return <>
      {!props.hideIcon && <img src="/img/img-robux.png" className={s.image} alt="Robux" />}
      <span className={s.amount}>{children}</span>
    </>
  }
  return <p className='mb-0'>
    <span className={s.prefix}>{props.prefix}</span>
    {!props.hideIcon && <img src="/img/img-robux.png" className={s.image} alt="Robux" />}
    <span className={s.amount}>{children}</span>
  </p>
}

export default Robux;