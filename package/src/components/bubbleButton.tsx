import { GitBranchIcon } from 'lucide-react';
import React from 'react';

const BubbleButton = ({text} : {text:string}) => {
    const onClick = () => {
        chrome.runtime.sendMessage({ type: 'SELECTION', text });
    }
    const onMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
    };

    return(
      <button
        id="ext-add-to-prompt-btn"
        type="button"
        className="btn relative bg-black btn-secondary active:opacity-1 shadow-long flex rounded-xl border-none"
        onMouseDown={onMouseDown}
        onClick={onClick}
      >
        <div className='flex items-center justify-center gap-1.5 whitespace-nowrap! max-md:sr-only'>
        <GitBranchIcon width={20} height={20}/>
        Add to BranChat
        </div>
      </button>
    )

}


export default BubbleButton;