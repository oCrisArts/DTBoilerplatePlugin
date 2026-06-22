function Container1() {
  return (
    <div className="bg-[#05061a] relative rounded-[4px] shrink-0 size-[24px]" data-name="Container">
      <div aria-hidden className="absolute border border-[rgba(0,0,0,0.05)] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function Text() {
  return (
    <div className="flex-[209_0_0] min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center overflow-clip relative rounded-[inherit] size-full">
        <p className="[word-break:break-word] font-['Consolas:Regular',sans-serif] leading-[15px] not-italic relative shrink-0 text-[#0c0c0d] text-[10px] whitespace-nowrap">MidnightDepth</p>
      </div>
    </div>
  );
}

export default function Container() {
  return (
    <div className="content-stretch flex gap-[10px] items-center px-[8px] relative rounded-[6px] size-full" data-name="Container">
      <Container1 />
      <Text />
    </div>
  );
}