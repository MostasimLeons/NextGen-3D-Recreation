import StatementSection from './StatementSection.jsx';
import CraftedSection from './CraftedSection.jsx';
import EverydaySection from './EverydaySection.jsx';
import FeaturesSection from './FeaturesSection.jsx';
import MaterialSection from './MaterialSection.jsx';
import VariantsSection from './VariantsSection.jsx';
import OutroSection from './OutroSection.jsx';
import './story.css';

/** The scroll story that follows the hero (order mirrors oryzo.ai). */
export default function Story() {
  return (
    <>
      <StatementSection />
      <CraftedSection />
      <EverydaySection />
      <FeaturesSection />
      <MaterialSection />
      <VariantsSection />
      <OutroSection />
    </>
  );
}
