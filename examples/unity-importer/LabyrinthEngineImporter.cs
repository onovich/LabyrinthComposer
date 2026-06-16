using System;
using UnityEngine;

namespace LabyrinthComposer.Examples
{
    [Serializable]
    public sealed class LabyrinthEngineExport
    {
        public string exportVersion;
        public string generatedAt;
        public LabyrinthSourceProject sourceProject;
        public LabyrinthValidation validation;
        public LabyrinthSpace[] spaces;
        public LabyrinthConnection[] connections;
        public LabyrinthGate[] gates;
        public LabyrinthToken[] tokens;
        public LabyrinthPuzzle[] puzzles;
        public LabyrinthBeat[] beats;
    }

    [Serializable]
    public sealed class LabyrinthSourceProject
    {
        public string id;
        public string name;
        public string schemaVersion;
        public string rulePresetId;
        public string rulePresetName;
    }

    [Serializable]
    public sealed class LabyrinthValidation
    {
        public bool ok;
        public string[] reachableSpaces;
        public string[] acquiredTokens;
        public string[] openedGates;
        public string[] solvedPuzzles;
        public LabyrinthDiagnostic[] diagnostics;
    }

    [Serializable]
    public sealed class LabyrinthDiagnostic
    {
        public string id;
        public string ruleId;
        public string severity;
        public string message;
        public bool suppressed;
    }

    [Serializable]
    public sealed class LabyrinthSpace
    {
        public string id;
        public string name;
        public string description;
        public string[] tags;
    }

    [Serializable]
    public sealed class LabyrinthConnection
    {
        public string id;
        public string fromSpaceId;
        public string toSpaceId;
        public bool directed;
        public string gateId;
        public string description;
    }

    [Serializable]
    public sealed class LabyrinthGate
    {
        public string id;
        public string name;
        public string kind;
        public string[] requiredTokenIds;
        public string description;
    }

    [Serializable]
    public sealed class LabyrinthToken
    {
        public string id;
        public string name;
        public string kind;
        public string locationSpaceId;
        public string description;
    }

    [Serializable]
    public sealed class LabyrinthPuzzle
    {
        public string id;
        public string name;
        public string locationSpaceId;
        public string[] requiredTokenIds;
        public string[] outputTokenIds;
        public string description;
    }

    [Serializable]
    public sealed class LabyrinthBeat
    {
        public string id;
        public string name;
        public string spaceId;
        public string kind;
        public float intensity;
        public int order;
        public string description;
    }

    public static class LabyrinthEngineImporter
    {
        public static LabyrinthEngineExport FromJson(string json)
        {
            return JsonUtility.FromJson<LabyrinthEngineExport>(json);
        }

        public static LabyrinthSpace FindSpace(LabyrinthEngineExport data, string id)
        {
            return Array.Find(data.spaces ?? Array.Empty<LabyrinthSpace>(), item => item.id == id);
        }

        public static LabyrinthGate FindGate(LabyrinthEngineExport data, string id)
        {
            return Array.Find(data.gates ?? Array.Empty<LabyrinthGate>(), item => item.id == id);
        }

        public static LabyrinthToken FindToken(LabyrinthEngineExport data, string id)
        {
            return Array.Find(data.tokens ?? Array.Empty<LabyrinthToken>(), item => item.id == id);
        }
    }
}
