import React from 'react';
import { AffinityData } from '../types';
import AffinityTracker from './AffinityTracker';

interface CompanionPanelProps {
  companions: string[];
  affinityData: AffinityData;
}

const CompanionPanel = ({ companions, affinityData }: CompanionPanelProps) => {
  if (companions.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-stone-500 italic">
        Bạn đang phiêu lưu một mình.
      </div>
    );
  }

  const companionAffinity: AffinityData = companions.reduce((acc, name) => {
    if (affinityData.hasOwnProperty(name)) {
      acc[name] = affinityData[name];
    }
    return acc;
  }, {} as AffinityData);

  return (
      <AffinityTracker affinityData={companionAffinity} />
  );
};

export default CompanionPanel;
