package com.carelabs.aisymptomservice.service;

import com.carelabs.aisymptomservice.dto.SymptomAnalysisResult;
import com.carelabs.aisymptomservice.dto.SymptomCheckResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class SymptomCheckService {

    @Value("${llm.provider:}")
    private String provider;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.api.model:}")
    private String geminiModel;

    @Value("${openai.api.key:}")
    private String openaiApiKey;

    @Value("${openai.api.model:}")
    private String openaiModel;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SymptomCheckResponse analyzeSymptoms(String symptoms) {
        try {
            SymptomAnalysisResult analysis;

            if (symptoms == null || symptoms.isBlank()) {
                return buildNonSymptomResponse();
            }

            if ("gemini".equalsIgnoreCase(provider)) {
                analysis = analyzeWithGemini(symptoms);
            } else if ("openai".equalsIgnoreCase(provider)) {
                analysis = analyzeWithOpenAi(symptoms);
            } else {
                throw new RuntimeException("Unsupported provider: " + provider);
            }

            return SymptomCheckResponse.builder()
                    .result(analysis.getResult())
                    .confidenceScore(analysis.isSymptomQuery() ? analysis.getConfidenceScore() : null)
                    .recommendedSpecialty(analysis.isSymptomQuery() ? analysis.getRecommendedSpecialty() : null)
                    .build();

        } catch (Exception e) {
            return buildFallbackResponse();
        }
    }

    private SymptomAnalysisResult analyzeWithGemini(String symptoms) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            throw new RuntimeException("Gemini API key is missing");
        }

        if (geminiModel == null || geminiModel.isBlank()) {
            throw new RuntimeException("Gemini model is missing");
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel
                + ":generateContent?key=" + geminiApiKey;

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", buildPrompt(symptoms))
                        ))
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    new ParameterizedTypeReference<>() {}
            );

            Map<String, Object> responseBody = response.getBody();
            if (responseBody == null) {
                throw new RuntimeException("Empty response from Gemini");
            }

            String text = extractGeminiText(responseBody);
            return parseModelJson(text);

        } catch (RestClientException e) {
            throw new RuntimeException("Gemini API request failed", e);
        }
    }

    private SymptomAnalysisResult analyzeWithOpenAi(String symptoms) {
        if (openaiApiKey == null || openaiApiKey.isBlank()) {
            throw new RuntimeException("OpenAI API key is missing");
        }

        if (openaiModel == null || openaiModel.isBlank()) {
            throw new RuntimeException("OpenAI model is missing");
        }

        String url = "https://api.openai.com/v1/responses";

        Map<String, Object> requestBody = Map.of(
                "model", openaiModel,
                "input", buildPrompt(symptoms)
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openaiApiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    new ParameterizedTypeReference<>() {}
            );

            Map<String, Object> responseBody = response.getBody();
            if (responseBody == null) {
                throw new RuntimeException("Empty response from OpenAI");
            }

            String text = extractOpenAiText(responseBody);
            return parseModelJson(text);

        } catch (RestClientException e) {
            throw new RuntimeException("OpenAI API request failed", e);
        }
    }

    private String buildPrompt(String symptoms) {
        return """
                You are a digital symptom checker for a healthcare platform.

                Return ONLY valid JSON.
                Do not return markdown.
                Do not return explanations outside JSON.

                Required JSON fields:
                - result
                - confidenceScore
                - recommendedSpecialty
                - symptomQuery

                Rules:

                1. If the user's message is NOT a real symptom description, return:
                {
                  "result": "I’m your digital symptom checker. If you describe your symptoms, I can give a preliminary health suggestion and recommend a doctor specialty.",
                  "confidenceScore": null,
                  "recommendedSpecialty": null,
                  "symptomQuery": false
                }

                2. If the user's message IS a symptom description:
                   - symptomQuery must be true
                   - confidenceScore must be a decimal number between 0 and 1, or between 0 and 100
                   - recommendedSpecialty must contain a suitable doctor specialty
                   - result must be a natural user-facing sentence
                   - result MUST include:
                     a) a possible preliminary health suggestion
                     b) "This is only a preliminary AI suggestion and not a diagnosis."
                     c) confidence shown as percentage, for example 85%
                     d) recommended specialty in natural text
                   - confidenceScore and recommendedSpecialty must ALSO be returned separately as their own JSON fields

                3. recommendedSpecialty must be a short specialty name only, like:
                   "General Physician", "Cardiologist", "Dermatologist", "Neurologist", "ENT Specialist",
                   "Pediatrician", "Psychologist", "Psychiatrist", "Ophthalmologist", "Orthopedic Specialist"

                4. JSON only.

                User message:
                """ + symptoms;
    }

    @SuppressWarnings("unchecked")
    private String extractGeminiText(Map<String, Object> body) {
        try {
            List<Map<String, Object>> candidates =
                    (List<Map<String, Object>>) body.get("candidates");

            if (candidates == null || candidates.isEmpty()) {
                throw new RuntimeException("No candidates returned from Gemini");
            }

            Map<String, Object> firstCandidate = candidates.get(0);
            Map<String, Object> content = (Map<String, Object>) firstCandidate.get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");

            if (parts == null || parts.isEmpty()) {
                throw new RuntimeException("No text parts returned from Gemini");
            }

            Map<String, Object> firstPart = parts.get(0);
            Object text = firstPart.get("text");

            if (text == null || text.toString().isBlank()) {
                throw new RuntimeException("Gemini text response is missing");
            }

            return text.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Gemini response", e);
        }
    }

    @SuppressWarnings("unchecked")
    private String extractOpenAiText(Map<String, Object> body) {
        Object outputText = body.get("output_text");
        if (outputText != null && !outputText.toString().isBlank()) {
            return outputText.toString();
        }

        try {
            List<Map<String, Object>> output = (List<Map<String, Object>>) body.get("output");
            if (output != null && !output.isEmpty()) {
                Map<String, Object> firstOutput = output.get(0);
                List<Map<String, Object>> content = (List<Map<String, Object>>) firstOutput.get("content");
                if (content != null && !content.isEmpty()) {
                    Object text = content.get(0).get("text");
                    if (text != null && !text.toString().isBlank()) {
                        return text.toString();
                    }
                }
            }
        } catch (Exception ignored) {
        }

        throw new RuntimeException("Failed to parse OpenAI response");
    }

    private SymptomAnalysisResult parseModelJson(String json) {
        try {
            String cleanedJson = cleanJson(json);
            SymptomAnalysisResult parsed = objectMapper.readValue(cleanedJson, SymptomAnalysisResult.class);

            if (parsed.getResult() == null || parsed.getResult().isBlank()) {
                throw new RuntimeException("AI response missing result");
            }

            if (!parsed.isSymptomQuery()) {
                return SymptomAnalysisResult.builder()
                        .result(parsed.getResult())
                        .confidenceScore(null)
                        .recommendedSpecialty(null)
                        .symptomQuery(false)
                        .build();
            }

            Double confidence = parsed.getConfidenceScore();
            if (confidence == null) {
                confidence = 70.0;
            }

            if (confidence <= 1) {
                confidence = confidence * 100;
            }

            if (confidence < 0) {
                confidence = 0.0;
            }

            if (confidence > 100) {
                confidence = 100.0;
            }

            String specialty = parsed.getRecommendedSpecialty();
            if (specialty == null || specialty.isBlank()) {
                specialty = "General Physician";
            }

            return SymptomAnalysisResult.builder()
                    .result(parsed.getResult())
                    .confidenceScore(confidence)
                    .recommendedSpecialty(specialty)
                    .symptomQuery(true)
                    .build();

        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse AI JSON response", e);
        }
    }

    private String cleanJson(String json) {
        if (json == null || json.isBlank()) {
            throw new RuntimeException("AI returned empty response");
        }

        String cleaned = json.trim();

        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7).trim();
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3).trim();
        }

        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3).trim();
        }

        int firstBrace = cleaned.indexOf("{");
        int lastBrace = cleaned.lastIndexOf("}");

        if (firstBrace == -1 || lastBrace == -1 || firstBrace > lastBrace) {
            throw new RuntimeException("No valid JSON object found in AI response");
        }

        return cleaned.substring(firstBrace, lastBrace + 1);
    }

    private SymptomCheckResponse buildNonSymptomResponse() {
        return SymptomCheckResponse.builder()
                .result("I’m your digital symptom checker. If you describe your symptoms, I can give a preliminary health suggestion and recommend a doctor specialty.")
                .confidenceScore(null)
                .recommendedSpecialty(null)
                .build();
    }

    private SymptomCheckResponse buildFallbackResponse() {
        return SymptomCheckResponse.builder()
                .result("Sorry, I couldn't analyze your symptoms at the moment. This is only a preliminary AI service and not a diagnosis. Please try again later or consult a General Physician.")
                .confidenceScore(50.0)
                .recommendedSpecialty("General Physician")
                .build();
    }
}