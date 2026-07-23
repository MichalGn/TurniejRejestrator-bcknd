package pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.gus;

import jakarta.enterprise.context.ApplicationScoped;
import java.io.StringReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.gus.dto.GusCompanyDto;

@ApplicationScoped
public class GusBirClient {

    private static final String DEFAULT_ENDPOINT
            = "https://wyszukiwarkaregon.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc";
    private static final String ACTION_BASE
            = "http://CIS/BIR/PUBL/2014/07/IUslugaBIRzewnPubl/";
    private static final Duration CACHE_TTL = Duration.ofHours(12);

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    public Optional<GusCompanyDto> findByNip(String nip) {
        CacheEntry cached = cache.get(nip);
        if (cached != null && cached.valid()) {
            return Optional.of(cached.company());
        }

        String apiKey = "a548f908257a4b8f8500";//requiredEnvironment("GUS_BIR_API_KEY");
        String endpoint = optionalEnvironment("GUS_BIR_ENDPOINT", DEFAULT_ENDPOINT);
        String sid = login(endpoint, apiKey);

        try {
            Optional<GusCompanyDto> result = searchByNip(endpoint, sid, nip);
            result.ifPresent(company -> cache.put(nip, new CacheEntry(company, Instant.now())));
            return result;
        } finally {
            logoutQuietly(endpoint, sid);
        }
    }

    private String login(String endpoint, String apiKey) {
        String body = "<bir:Zaloguj>"
                + "<bir:pKluczUzytkownika>" + escapeXml(apiKey) + "</bir:pKluczUzytkownika>"
                + "</bir:Zaloguj>";
        Document response = send(endpoint, "Zaloguj", body, null);
        String sid = firstText(response, "ZalogujResult");
        if (sid.isBlank()) {
            throw new GusBirException("GUS nie zwrócił identyfikatora sesji. Sprawdź klucz GUS_BIR_API_KEY.");
        }
        return sid.trim();
    }

    private Optional<GusCompanyDto> searchByNip(String endpoint, String sid, String nip) {
        String body = "<bir:DaneSzukajPodmioty>"
                + "<bir:pParametryWyszukiwania>"
                + "<dat:Nip>" + nip + "</dat:Nip>"
                + "</bir:pParametryWyszukiwania>"
                + "</bir:DaneSzukajPodmioty>";

        Document response = send(endpoint, "DaneSzukajPodmioty", body, sid);
        String resultXml = firstText(response, "DaneSzukajPodmiotyResult");
        if (resultXml.isBlank()) {
            return Optional.empty();
        }

        Document result = parseXml(resultXml);
        Node data = firstNode(result, "dane");
        if (data == null) {
            return Optional.empty();
        }

        String returnedNip = childText(data, "Nip");
        String name = childText(data, "Nazwa");
        String city = childText(data, "Miejscowosc");
        String zipCode = childText(data, "KodPocztowy");
        String street = childText(data, "Ulica");
        String building = childText(data, "NrNieruchomosci");
        String apartment = childText(data, "NrLokalu");

        if (name.isBlank()) {
            return Optional.empty();
        }

        return Optional.of(new GusCompanyDto(
                returnedNip.isBlank() ? nip : returnedNip,
                name,
                buildStreetNo(street, building, apartment),
                zipCode,
                city));
    }

    private Document send(String endpoint, String operation, String body, String sid) {
        String action = ACTION_BASE + operation;
        String envelope = "<?xml version=\"1.0\" encoding=\"utf-8\"?>"
                + "<s:Envelope xmlns:s=\"http://www.w3.org/2003/05/soap-envelope\""
                + " xmlns:a=\"http://www.w3.org/2005/08/addressing\""
                + " xmlns:bir=\"http://CIS/BIR/PUBL/2014/07\""
                + " xmlns:dat=\"http://CIS/BIR/PUBL/2014/07/DataContract\">"
                + "<s:Header>"
                + "<a:Action s:mustUnderstand=\"1\">" + action + "</a:Action>"
                + "<a:To s:mustUnderstand=\"1\">" + escapeXml(endpoint) + "</a:To>"
                + "</s:Header>"
                + "<s:Body>" + body + "</s:Body>"
                + "</s:Envelope>";

        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(endpoint))
                .timeout(Duration.ofSeconds(25))
                .header("Content-Type", "application/soap+xml; charset=utf-8; action=\"" + action + "\"")
                .header("Accept", "application/soap+xml")
                .POST(HttpRequest.BodyPublishers.ofString(envelope));
        if (sid != null && !sid.isBlank()) {
            builder.header("sid", sid);
        }

        try {
            HttpResponse<String> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            printResponse(response, operation);
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new GusBirException("GUS zwrócił HTTP " + response.statusCode() + ".");
            }
            //Document document = parseXml(response.body());
            String responseBody = extractSoapXml(
                    response.body(),
                    response.headers()
                            .firstValue("Content-Type")
                            .orElse("")
            );

            Document document = parseXml(responseBody);

            String fault = firstText(document, "Text");
            if (firstNode(document, "Fault") != null) {
                throw new GusBirException(fault.isBlank() ? "GUS zwrócił błąd SOAP." : fault);
            }
            return document;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new GusBirException("Przerwano połączenie z GUS.", ex);
        } catch (GusBirException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new GusBirException("Nie udało się połączyć z usługą GUS BIR1.1.", ex);
        }
    }

    private void logoutQuietly(String endpoint, String sid) {
        if (sid == null || sid.isBlank()) {
            return;
        }
        try {
            send(endpoint, "Wyloguj", "<bir:Wyloguj><bir:pIdentyfikatorSesji>"
                    + escapeXml(sid) + "</bir:pIdentyfikatorSesji></bir:Wyloguj>", sid);
        } catch (RuntimeException ignored) {
            // Wygaszenie sesji nie powinno zepsuć poprawnego wyniku wyszukiwania.
        }
    }

    private static String buildStreetNo(String street, String building, String apartment) {
        StringBuilder value = new StringBuilder();
        if (!street.isBlank()) {
            value.append(street.trim());
        }
        if (!building.isBlank()) {
            if (value.length() > 0) {
                value.append(' ');
            }
            value.append(building.trim());
        }
        if (!apartment.isBlank()) {
            if (value.length() > 0) {
                value.append(' ');
            }
            value.append("m. ").append(apartment.trim());
        }
        return value.toString();
    }

    private static Document parseXml(String xml) {
        String normalizedXml = normalizeXml(xml);
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
            factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
            return factory.newDocumentBuilder().parse(
                    new InputSource(new StringReader(normalizedXml)));
        } catch (Exception ex) {
            throw new GusBirException(
                    "Nie udało się odczytać odpowiedzi XML z GUS. Początek odpowiedzi: "
                    + responsePreview(normalizedXml), ex);
        }
    }

    /**
     * GUS sometimes returns the XML embedded in SOAP with a Unicode BOM or
     * another invisible character before the XML declaration. A DOM parser then
     * reports: "Content is not allowed in prolog".
     */
    private static String normalizeXml(String xml) {
        if (xml == null) {
            throw new GusBirException("GUS zwrócił pustą odpowiedź.");
        }

        String normalized = xml.trim();

        while (!normalized.isEmpty()
                && (normalized.charAt(0) == '\uFEFF'
                || normalized.charAt(0) == '\u200B'
                || normalized.charAt(0) == '\u0000')) {
            normalized = normalized.substring(1).trim();
        }

        return normalized;
    }

    private static String responsePreview(String xml) {
        if (xml == null || xml.isEmpty()) {
            return "<pusta>";
        }
        String preview = xml.replace('\r', ' ').replace('\n', ' ');
        return preview.substring(0, Math.min(preview.length(), 160));
    }

    private static Node firstNode(Document document, String localName) {
        NodeList nodes = document.getElementsByTagNameNS("*", localName);
        return nodes.getLength() == 0 ? null : nodes.item(0);
    }

    private static String firstText(Document document, String localName) {
        Node node = firstNode(document, localName);
        return node == null || node.getTextContent() == null ? "" : node.getTextContent().trim();
    }

    private static String childText(Node parent, String localName) {
        NodeList children = parent.getChildNodes();
        for (int i = 0; i < children.getLength(); i++) {
            Node child = children.item(i);
            if (localName.equals(child.getLocalName()) || localName.equals(child.getNodeName())) {
                return child.getTextContent() == null ? "" : child.getTextContent().trim();
            }
        }
        return "";
    }

    private static String requiredEnvironment(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) {
            throw new GusBirException("Brak zmiennej środowiskowej " + name + ".");
        }
        return value.trim();
    }

    private static String optionalEnvironment(String name, String defaultValue) {
        String value = System.getenv(name);
        return value == null || value.isBlank() ? defaultValue : value.trim();
    }

    private static String escapeXml(String value) {
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }

    private record CacheEntry(GusCompanyDto company, Instant createdAt) {

        boolean valid() {
            return createdAt.plus(CACHE_TTL).isAfter(Instant.now());
        }
    }

    private static String extractSoapXml(
            String responseBody,
            String contentType) {

        if (responseBody == null || responseBody.isBlank()) {
            throw new GusBirException("GUS zwrócił pustą odpowiedź.");
        }

        if (contentType == null
                || !contentType.toLowerCase().contains("multipart/related")) {
            return responseBody;
        }

        int envelopeStart = responseBody.indexOf("<s:Envelope");

        if (envelopeStart < 0) {
            envelopeStart = responseBody.indexOf("<soap:Envelope");
        }

        if (envelopeStart < 0) {
            envelopeStart = responseBody.indexOf("<soapenv:Envelope");
        }

        if (envelopeStart < 0) {
            throw new GusBirException(
                    "Nie znaleziono SOAP Envelope w odpowiedzi multipart z GUS.");
        }

        int envelopeEnd = responseBody.indexOf("</s:Envelope>", envelopeStart);
        String closingTag = "</s:Envelope>";

        if (envelopeEnd < 0) {
            envelopeEnd = responseBody.indexOf(
                    "</soap:Envelope>",
                    envelopeStart);
            closingTag = "</soap:Envelope>";
        }

        if (envelopeEnd < 0) {
            envelopeEnd = responseBody.indexOf(
                    "</soapenv:Envelope>",
                    envelopeStart);
            closingTag = "</soapenv:Envelope>";
        }

        if (envelopeEnd < 0) {
            throw new GusBirException(
                    "Nie znaleziono końca SOAP Envelope w odpowiedzi GUS.");
        }

        envelopeEnd += closingTag.length();

        return responseBody.substring(
                envelopeStart,
                envelopeEnd
        );
    }

    private void printResponse(
            HttpResponse<String> response,
            String operation) {

        System.out.println("========== GUS RESPONSE ==========");
        System.out.println("Operation: " + operation);
        System.out.println("HTTP status: " + response.statusCode());
        System.out.println("Content-Type: "
                + response.headers()
                        .firstValue("Content-Type")
                        .orElse("<brak>"));
        System.out.println("Headers: " + response.headers().map());
        System.out.println("Body:");
        System.out.println(response.body());
        System.out.println("======== END GUS RESPONSE ========");
    }
}
