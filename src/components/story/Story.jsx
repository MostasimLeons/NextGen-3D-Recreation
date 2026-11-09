import StatementSection from './StatementSection.jsx';
import CraftedSection from './CraftedSection.jsx';
import EverydaySection from './EverydaySection.jsx';
import FeaturesSection from './FeaturesSection.jsx';
import InteractiveSection from './InteractiveSection.jsx';
import MaterialSection from './MaterialSection.jsx';
import ToolkitSection from './ToolkitSection.jsx';
import ProcessSection from './ProcessSection.jsx';
import ProjectsSection from './ProjectsSection.jsx';
import OutroSection from './OutroSection.jsx';
import './story.css';
import './story-sections.css';

/** The scroll story after the hero — order mirrors oryzo.ai (see storyConfig.js). */
export default function Story({ rig }) {
  return (
    <>
      <StatementSection />
      <CraftedSection />
      <EverydaySection />
      <FeaturesSection />
      <InteractiveSection rig={rig} />
      <MaterialSection />
      <ToolkitSection rig={rig} />
      <ProcessSection />
      <ProjectsSection />
      <OutroSection />
    </>
  );
}
