import React from 'react';

const BubbleButton = ({text} : {text:string}) => {
    const onClick = () => {
        console.log("text");
    }

    const onMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
    };

    return(
      <button
        id="ext-add-to-prompt-btn"
        type="button"
        className="btn relative shadow-long flex rounded-xl border-none"
        onMouseDown={onMouseDown}
        onClick={onClick}
      >
        click this;
      </button>
    )

}


export default BubbleButton;