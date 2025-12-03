interface HeartRateWaveProps {
  color: string;
  className?: string;
}

export function HeartRateWave({ color, className = "" }: HeartRateWaveProps) {
  return (
    <div className={`h-10 w-full overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 200 40"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="50%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.3" />
          </linearGradient>
        </defs>
        {/* ECG-style path */}
        <path
          d="M0,20 L20,20 L25,20 L30,20 L35,20 L40,18 L45,22 L50,20 
             L55,20 L60,20 L65,5 L70,35 L75,10 L80,20 
             L85,20 L90,20 L95,20 L100,20 
             L105,20 L110,20 L115,18 L120,22 L125,20 
             L130,20 L135,20 L140,5 L145,35 L150,10 L155,20 
             L160,20 L165,20 L170,20 L175,20 L180,20 L185,20 L190,20 L195,20 L200,20"
          fill="none"
          stroke="url(#waveGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
