import { createUseStyles } from "react-jss";

const useTicketStyles = createUseStyles({
  text: {
    color: '#A61',
    fontWeight: 'bold',
    fontSize: '15px',
  },
  image: {
    background: `url("/img/img-tickets.png")`,
    width: '18px',
    height: '18px',
    marginLeft: '0',
    marginTop: '1px',
    marginRight: '2px',
    display: 'inline-block',
    verticalAlign: 'bottom',
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

const Tickets = props => {
  const s = useTicketStyles();
  let children = props.children;
  if (typeof children === 'number') {
    children = children.toLocaleString();
  }
  return <span className={s.wrapper}>
    {props.prefix ? <span className={s.text + ' ' + s.prefix}>{props.prefix}</span> : null}
    <span className={s.image}></span>
    <span className={s.text}>{children}</span>
  </span>
}

export default Tickets;