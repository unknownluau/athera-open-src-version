import { useEffect, useRef, useState } from "react";
import { createUseStyles } from "react-jss"

const useDropdownStyles = createUseStyles({
  wrapper: {
    border: '1px solid #565655',
    width: '100%',
  },
  wrapperUnstyled: {
    border: 'none',
    width: '100%',
  },
  heading: {
    background: 'linear-gradient(0deg, rgba(86,86,85,1) 0%, rgba(128,127,127,1) 100%)',
    padding: '2px',
  },
  headingUnstyled: {
    background: 'none',
    padding: 0,
  },
  mainBody: {
    backgroundColor: '#efefef',
  },
  caret: {
    float: 'right',
    color: '#666666',
    paddingTop: '0px',
    fontSize: '18px',
    fontWeight: 400,
    userSelect: 'none',
  },
  itemDiv: {
    paddingLeft: '8px',
    paddingRight: '8px',
    paddingTop: '4px',
    paddingBottom: '4px',
    cursor: 'pointer',
    '&:hover': {
      background: '#d8d8d8',
    },
  },
  separator: {
    borderBottom: '1px solid #c3c3c3',
    width: '100%',
  },
  accordionContent: {
    maxHeight: 0,
    overflow: 'hidden',
    transition: 'max-height 0.3s ease-out',
    backgroundColor: '#f5f5f5',
  },
  accordionExpanded: {
    maxHeight: '1000px', // Large enough to contain all items
  },
  subItemDiv: {
    paddingLeft: '24px',
    paddingRight: '8px',
    paddingTop: '4px',
    paddingBottom: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    '&:hover': {
      background: '#d8d8d8',
    },
  },
});
/**
 * Ancient dropdown used for catalog page + other stuff
 * @param {{title: JSX.Element; onClick: (e: any, data: any) => void; items: {name: string; clickData: any; children?: {title: string; children?: {name: string; clickData: any;}[]}}[]; unstyled?: boolean;}} props
 */
const Dropdown = props => {
  const s = useDropdownStyles();
  const [leftMenu, setLeftMenu] = useState(null);
  const wrapperRef = useRef(null);
  const leftMenuRef = useRef(null);

  const leftMenuStyles = {
    marginLeft: (wrapperRef.current?.clientWidth || 0) + 'px',
    zIndex: 11
  };

  return <div onMouseLeave={() => {
    setLeftMenu(null);
  }}>
    <div className={props.unstyled ? s.wrapperUnstyled : s.wrapper} ref={wrapperRef}>
      <div className={props.unstyled ? s.headingUnstyled : s.heading}>
        {props.title}
      </div>
      <div className={s.mainBody}>
        {
          props.items.map((v, i) => {
            if (v.name === 'separator') {
              return <div key={'separator' + i} className={s.separator}></div>
            }
            const isExpanded = leftMenu && leftMenu.title === v.children?.title;
            return <div key={v.name}>
              <div className={s.itemDiv} onClick={(e) => {
                if (v.children) {
                  if (isExpanded) {
                    setLeftMenu(null);
                  } else {
                    setLeftMenu(v.children);
                  }
                } else {
                  props.onClick(e, v.clickData);
                }
              }}>
                <p className={`mb-0 mt-0`}>
                  {v.name} {v.children && <span className={s.caret}>{isExpanded ? '-' : '+'}</span>}
                </p>
              </div>
              {v.children && (
                <div className={`${s.accordionContent} ${isExpanded ? s.accordionExpanded : ''}`}>
                  {v.children.children.map(sub => {
                    return <div key={sub.name} className={s.subItemDiv} onClick={(e) => {
                      props.onClick(e, sub.clickData);
                    }}>
                      <p className={`mb-0 mt-0`}>{sub.name}</p>
                    </div>
                  })}
                </div>
              )}
            </div>
          })
        }
      </div>
    </div>
  </div>
}

export default Dropdown;