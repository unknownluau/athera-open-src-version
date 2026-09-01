import { createUseStyles } from "react-jss";

const useRobuxStyles = createUseStyles({
  text: {
    color: '#02b757',
    fontWeight: 'bold',
    fontSize: '15px',
  },
  image: {
    width: '18px',
    height: '18px',
    objectFit: 'contain',
    marginLeft: '0',
    marginTop: '1px',
    marginRight: '2px',
    verticalAlign: 'bottom',
    display: 'inline-block',
  },
  prefix: {
    marginRight: '4px',
    display: 'inline-block',
    verticalAlign: 'bottom',
  },
  wrapper: {
    whiteSpace: 'nowrap',
  },
});

const Robux = props => {
  const s = useRobuxStyles();
  let children = props.children;
  if (typeof children === 'number') {
    children = children.toLocaleString();
  }
  return <span className={s.wrapper}>
    {props.prefix ? <span className={s.text + ' ' + s.prefix + ' ' + (props.prefixClassName || '')}>{props.prefix}</span> : null}
    <img src={props.icon || "/img/img-robux.png"} className={s.image} alt="Robux" />
    <span className={s.text + ' ' + (props.className || '')}>{children}</span>
  </span>
}

export default Robux;