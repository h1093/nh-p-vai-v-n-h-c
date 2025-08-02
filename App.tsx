import React from 'react';
import { useGameLogic } from './hooks/useGameLogic';

import { GameStatus } from './types';
import LoadingIndicator from './components/LoadingIndicator';
import LorebookModal from './components/LorebookModal';
import ChangelogScreen from './components/ChangelogScreen';
import GameScreen from './components/GameScreen';
import ApiKeyScreen from './components/screens/ApiKeyScreen';
import WorkSelectionScreen from './components/screens/WorkSelectionScreen';
import WorldCreatorScreen from './components/screens/WorldCreatorScreen';
import ModeSelectionScreen from './components/screens/ModeSelectionScreen';
import CharacterCreationScreen from './components/screens/CharacterCreationScreen';
import StoryStartingScreen from './components/screens/StoryStartingScreen';
import ErrorScreen from './components/screens/ErrorScreen';

const App = () => {
  const {
    status,
    isLoading,
    activeAI,
    selectedWork,
    character,
    history,
    lastTurnInfo,
    error,
    isNsfwEnabled,
    lorebook,
    affinity,
    inventory,
    equipment,
    companions,
    dating,
    spouse,
    pregnancy,
    gameTime,
    isLorebookOpen,
    isChangelogOpen,
    suggestedActions,
    savedGames,
    savedCharacters,
    goals,
    isGeneratingBackground,
    setIsLorebookOpen,
    setIsChangelogOpen,
    handleApiKeySubmit,
    handleChangeApiKey,
    handleSelectWork,
    handleStartWorldCreation,
    handleCreateCustomWork,
    resetToWorkSelection,
    handleStartOriginal,
    handleStartFanfic,
    handleStartCharacterCreation,
    resetToModeSelection,
    setIsNsfwEnabled,
    handleUserInput,
    handleSaveAndExit,
    handleUpdateLastNarrative,
    handleRegenerate,
    handleEquipItem,
    handleUnequipItem,
    handleConfess,
    handlePropose,
    handleChatWithCompanion,
    handleGiveGiftToCompanion,
    handleAddLoreEntry,
    handleUpdateLoreEntry,
    handleDeleteLoreEntry,
    handleAddGoal,
    handleToggleGoal,
    handleDeleteGoal,
    handleLoadGame,
    handleDeleteGame,
    handleExportGame,
    handleImportGame,
    handleDeleteCharacter,
    handleGenerateBackground,
    LITERARY_WORKS,
    CHANGELOG_ENTRIES,
  } = useGameLogic();

  const renderContent = () => {
    switch (status) {
      case GameStatus.ApiKeyEntry:
        return <ApiKeyScreen onSubmit={handleApiKeySubmit} error={error} />;
      case GameStatus.WorkSelection:
        return (
          <WorkSelectionScreen
            works={LITERARY_WORKS}
            savedGames={savedGames}
            onSelectWork={handleSelectWork}
            onCreateCustom={handleStartWorldCreation}
            onChangeApiKey={handleChangeApiKey}
            onShowChangelog={() => setIsChangelogOpen(true)}
            onLoadGame={handleLoadGame}
            onDeleteGame={handleDeleteGame}
            onExportGame={handleExportGame}
            onImportGame={handleImportGame}
          />
        );
      case GameStatus.WorldCreation:
        return (
          <WorldCreatorScreen
            onSubmit={handleCreateCustomWork}
            onBack={resetToWorkSelection}
          />
        );
      case GameStatus.Start:
        return selectedWork && (
          <ModeSelectionScreen
            work={selectedWork}
            onStartAsOriginal={handleStartOriginal}
            onStartFanfic={handleStartCharacterCreation}
            onBack={resetToWorkSelection}
            isNsfwEnabled={isNsfwEnabled}
            onNsfwToggle={setIsNsfwEnabled}
          />
        );
      case GameStatus.CharacterCreation:
        return selectedWork && (
          <CharacterCreationScreen
            work={selectedWork}
            onSubmit={handleStartFanfic}
            onBack={resetToModeSelection}
            savedCharacters={savedCharacters}
            onDeleteCharacter={handleDeleteCharacter}
            onGenerateBackground={handleGenerateBackground}
            isGeneratingBackground={isGeneratingBackground}
          />
        );
      case GameStatus.StoryStarting:
        return <StoryStartingScreen activeAI={activeAI} />;
      case GameStatus.Playing:
        return selectedWork && character && (
          <GameScreen
            character={character}
            history={history}
            onUserInput={handleUserInput}
            loading={isLoading}
            activeAI={activeAI}
            onSaveAndExit={handleSaveAndExit}
            onOpenLorebook={() => setIsLorebookOpen(true)}
            isLorebookOpen={isLorebookOpen}
            workTitle={selectedWork.title}
            onUpdateLastNarrative={handleUpdateLastNarrative}
            onRegenerate={handleRegenerate}
            canRegenerate={!!lastTurnInfo}
            affinity={affinity}
            inventory={inventory}
            equipment={equipment}
            companions={companions}
            onEquipItem={handleEquipItem}
            onUnequipItem={handleUnequipItem}
            gameTime={gameTime}
            dating={dating}
            spouse={spouse}
            pregnancy={pregnancy}
            onConfess={handleConfess}
            onPropose={handlePropose}
            onChat={handleChatWithCompanion}
            onGiveGift={handleGiveGiftToCompanion}
            suggestedActions={suggestedActions}
            goals={goals}
            onAddGoal={handleAddGoal}
            onToggleGoal={handleToggleGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        );
      case GameStatus.Error:
        return (
          <ErrorScreen
            error={error}
            onChangeApiKey={handleChangeApiKey}
            onRetry={resetToWorkSelection}
          />
        );
      default:
        return <LoadingIndicator />;
    }
  };

  return (
    <div className="min-h-screen w-full text-gray-200 flex items-center justify-center p-4">
      <main className="relative z-10 w-full">
        {renderContent()}
      </main>
      <LorebookModal
        isOpen={isLorebookOpen}
        onClose={() => setIsLorebookOpen(false)}
        entries={lorebook}
        onAdd={handleAddLoreEntry}
        onUpdate={handleUpdateLoreEntry}
        onDelete={handleDeleteLoreEntry}
      />
      <ChangelogScreen
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
        entries={CHANGELOG_ENTRIES}
      />
    </div>
  );
};

export default App;
