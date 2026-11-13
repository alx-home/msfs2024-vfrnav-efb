function SectionHeading({
  title,
  description,
  id
}: {
  title: string;
  description: string;
  id?: string;
}) {
  return (
    <div className="mb-[1.7rem] max-w-[760px] scroll-mt-24 max-[900px]:scroll-mt-4" id={id}>
      <h2 className="mb-[.65rem] text-[clamp(1.8rem,4vw,2.65rem)] leading-[1.15] font-bold tracking-[-.035em]">{title}</h2>
      <p className="text-muted">{description}</p>
    </div>
  );
}

export default SectionHeading;
