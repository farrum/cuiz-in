
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useGameMode, GAME_MODE_CONFIGS } from '@/hooks/quiz/useGameMode';
import { GameMode } from '@/utils/types';
import { Brain, Timer, Users, Zap, Minus, Plus } from 'lucide-react';

const ModeIcon = ({ mode }: { mode: GameMode }) => {
  switch (mode) {
    case 'normal':
      return <Brain className="h-5 w-5" />;
    case 'time-attack':
      return <Timer className="h-5 w-5" />;
    case 'team-quiz':
      return <Users className="h-5 w-5" />;
    case 'streak':
      return <Zap className="h-5 w-5" />;
    default:
      return <Brain className="h-5 w-5" />;
  }
};

const GameModeSelector: React.FC = () => {
  const { currentMode, changeGameMode, allModes, modeConfigs, teamSize, updateTeamSize } = useGameMode();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Game Mode</CardTitle>
        <CardDescription>Select how you want to play</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={currentMode} className="w-full" onValueChange={(value) => changeGameMode(value as GameMode)}>
          <TabsList className="grid grid-cols-4 mb-4">
            {allModes.map((mode) => (
              <TabsTrigger key={mode} value={mode} className="flex items-center space-x-1">
                <ModeIcon mode={mode} />
                <span className="hidden md:inline">{modeConfigs[mode].name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {allModes.map((mode) => (
            <TabsContent key={mode} value={mode}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ModeIcon mode={mode} />
                    <span className="ml-2">{modeConfigs[mode].name}</span>
                  </CardTitle>
                  <CardDescription>{modeConfigs[mode].description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {mode === 'streak' && (
                    <p>Build up your streak to earn bonus gems! Each consecutive correct answer increases your multiplier.</p>
                  )}
                  {mode === 'time-attack' && (
                    <p>You have {modeConfigs[mode].timeLimit} seconds to answer as many questions as possible.</p>
                  )}
                  {mode === 'team-quiz' && (
                    <div className="space-y-4">
                      <p>Team up with friends to tackle challenges together and earn shared rewards.</p>
                      <div className="flex items-center justify-between">
                        <span>Team Size:</span>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => updateTeamSize(teamSize - 1)}
                            disabled={teamSize <= 2}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{teamSize}</span>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => updateTeamSize(teamSize + 1)}
                            disabled={teamSize >= 10}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Team members share gems and achievements. Larger teams get higher point multipliers.
                      </div>
                    </div>
                  )}
                </CardContent>
                {mode === 'team-quiz' && (
                  <CardFooter className="flex justify-between">
                    <div className="text-sm">
                      <span className="font-medium">Point Multiplier:</span> {teamSize * 0.5}x
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Max Team Size:</span> 10
                    </div>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default GameModeSelector;
