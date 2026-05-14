import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Polygon, Line, Circle, G, Text as SvgText } from 'react-native-svg';

interface RadarData {
  label: string;
  value: number; // 0 to 100
}

interface RadarChartProps {
  data: RadarData[];
  size?: number;
  color?: string;
}

export const RadarChart = ({ data, size = 250, color = '#3b82f6' }: RadarChartProps) => {
  const radius = size / 2.5;
  const centerX = size / 2;
  const centerY = size / 2;
  const angleStep = (Math.PI * 2) / data.length;

  // Calculate points for the polygon
  const points = data.map((item, i) => {
    const r = (item.value / 100) * radius;
    const angle = i * angleStep - Math.PI / 2;
    return `${centerX + r * Math.cos(angle)},${centerY + r * Math.sin(angle)}`;
  }).join(' ');

  // Grid lines
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1];
  
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G>
          {/* Grid Circles/Polygons */}
          {gridLevels.map((level, j) => {
            const gridPoints = data.map((_, i) => {
              const r = radius * level;
              const angle = i * angleStep - Math.PI / 2;
              return `${centerX + r * Math.cos(angle)},${centerY + r * Math.sin(angle)}`;
            }).join(' ');
            return (
              <Polygon
                key={`grid-${j}`}
                points={gridPoints}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            );
          })}

          {/* Axis Lines */}
          {data.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            return (
              <Line
                key={`axis-${i}`}
                x1={centerX}
                y1={centerY}
                x2={centerX + radius * Math.cos(angle)}
                y2={centerY + radius * Math.sin(angle)}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            );
          })}

          {/* The Data Polygon */}
          <Polygon
            points={points}
            fill={color}
            fillOpacity={0.3}
            stroke={color}
            strokeWidth="2"
          />

          {/* Labels */}
          {data.map((item, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const labelRadius = radius + 25;
            const lx = centerX + labelRadius * Math.cos(angle);
            const ly = centerY + labelRadius * Math.sin(angle);
            
            return (
              <SvgText
                key={`label-${i}`}
                x={lx}
                y={ly}
                fill="#64748b"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {item.label}
              </SvgText>
            );
          })}
        </G>
      </Svg>
    </View>
  );
};
