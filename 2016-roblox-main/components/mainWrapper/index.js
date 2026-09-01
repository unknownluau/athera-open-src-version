import { createUseStyles } from "react-jss"

const useStyles = createUseStyles({
  main: {
    minHeight: '95vh',
  }
})

const MainWrapper = ({ children, className }) => {
  const s = useStyles();
  return <div className={`${s.main} ${className || ''}`}>
    {children}
  </div>
}

export default MainWrapper;