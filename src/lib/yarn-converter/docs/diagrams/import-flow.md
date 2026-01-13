# Import Flow Diagram

```mermaid
flowchart TD
    Start[Yarn Spinner format string] --> Parse[Parse into YarnNodeBlock[]]
    Parse --> Iterate[Iterate over blocks]
    Iterate --> DetermineType[Determine node type from content]
    
    DetermineType --> CheckContent{Content analysis}
    CheckContent -->|Has '-> '| PlayerType[PLAYER]
    CheckContent -->|Has '<<if' blocks| ConditionalType[CONDITIONAL or CHARACTER]
    CheckContent -->|Has storylet marker| StoryletType[STORYLET]
    CheckContent -->|Has detour marker| DetourType[DETOUR]
    CheckContent -->|Default| CharacterType[CHARACTER]
    
    PlayerType --> GetPlayerHandler[Get PlayerHandler]
    ConditionalType --> GetConditionalHandler[Get ConditionalHandler or CharacterHandler]
    StoryletType --> GetStoryletHandler[Get StoryletHandler]
    DetourType --> GetDetourHandler[Get DetourHandler]
    CharacterType --> GetCharacterHandler[Get CharacterHandler]
    
    GetPlayerHandler --> ParseNode[Handler.importNode]
    GetConditionalHandler --> ParseNode
    GetStoryletHandler --> ParseNode
    GetDetourHandler --> ParseNode
    GetCharacterHandler --> ParseNode
    
    ParseNode --> ParseLines[Parse lines]
    ParseLines --> ExtractContent[Extract content/speaker]
    ExtractContent --> ExtractCommands[Extract commands]
    ExtractCommands --> ExtractChoices[Extract choices if PLAYER]
    ExtractChoices --> ExtractConditionals[Extract conditionals if CONDITIONAL]
    ExtractConditionals --> CreateNode[Create ForgeFlowNode]
    CreateNode --> CollectNodes[Collect all nodes]
    CollectNodes --> CreateGraph[Create ForgeGraphDoc]
    CreateGraph --> Result[ForgeGraphDoc with flow.nodes]
```
