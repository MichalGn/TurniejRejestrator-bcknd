package pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities;

import jakarta.persistence.Basic;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Set;

/**
 *
 * @author Michał Gnatowski
 * @date 25 wrz 2025
 * @email michal.gnatowski@atrop.pl
 */

@Entity
@Table(name = "registrations")
@NamedQueries({
    @NamedQuery(name = "Registrations.findAll", query = "SELECT r FROM Registrations r"),
    @NamedQuery(name = "Registrations.findById", query = "SELECT r FROM Registrations r WHERE r.id = :id"),
    @NamedQuery(name = "Registrations.findByUuid", query = "SELECT r FROM Registrations r WHERE r.uuid = :uuid"),
    @NamedQuery(name = "Registrations.findByClubName", query = "SELECT r FROM Registrations r WHERE r.clubName = :clubName"),
    @NamedQuery(name = "Registrations.findByNip", query = "SELECT r FROM Registrations r WHERE r.nip = :nip"),
    @NamedQuery(name = "Registrations.findByStreetNo", query = "SELECT r FROM Registrations r WHERE r.streetNo = :streetNo"),
    @NamedQuery(name = "Registrations.findByZipCode", query = "SELECT r FROM Registrations r WHERE r.zipCode = :zipCode"),
    @NamedQuery(name = "Registrations.findByCity", query = "SELECT r FROM Registrations r WHERE r.city = :city"),
    @NamedQuery(name = "Registrations.findByCountry", query = "SELECT r FROM Registrations r WHERE r.country = :country"),
    @NamedQuery(name = "Registrations.findByStatus", query = "SELECT r FROM Registrations r WHERE r.status = :status"),
    @NamedQuery(name = "Registrations.findByRegistratorName", query = "SELECT r FROM Registrations r WHERE r.registratorName = :registratorName"),
    @NamedQuery(name = "Registrations.findByEmail", query = "SELECT r FROM Registrations r WHERE r.email = :email"),
    @NamedQuery(name = "Registrations.findByPhone", query = "SELECT r FROM Registrations r WHERE r.phone = :phone"),
    @NamedQuery(name = "Registrations.findByTotalPrice", query = "SELECT r FROM Registrations r WHERE r.totalPrice = :totalPrice"),
    @NamedQuery(name = "Registrations.findByRegistrationType", query = "SELECT r FROM Registrations r WHERE r.registrationType = :registrationType")})
public class Registrations implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Size(max = 36)
    @Column(name = "uuid")
    private String uuid;
    @Size(max = 256)
    @Column(name = "club_name")
    private String clubName;
    @Size(max = 10)
    @Column(name = "nip")
    private String nip;
    @Size(max = 64)
    @Column(name = "street_no")
    private String streetNo;
    @Size(max = 10)
    @Column(name = "zip_code")
    private String zipCode;
    @Size(max = 32)
    @Column(name = "city")
    private String city;
    @Size(max = 32)
    @Column(name = "country")
    private String country;
    @Size(max = 16)
    @Column(name = "status")
    private String status;
    @Size(max = 256)
    @Column(name = "registrator_name")
    private String registratorName;
    // @Pattern(regexp="[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?", message="Invalid email")//if the field contains email address consider using this annotation to enforce field validation
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 512)
    @Column(name = "email")
    private String email;
    // @Pattern(regexp="^\\(?(\\d{3})\\)?[- ]?(\\d{3})[- ]?(\\d{4})$", message="Invalid phone/fax format, should be as xxx-xxx-xxxx")//if the field contains phone or fax number consider using this annotation to enforce field validation
    @Size(max = 128)
    @Column(name = "phone")
    private String phone;
    // @Max(value=?)  @Min(value=?)//if you know range of your decimal fields consider using these annotations to enforce field validation
    @Column(name = "total_price")
    private BigDecimal totalPrice;
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 16)
    @Column(name = "registration_type")
    private String registrationType;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "registrationId", fetch = FetchType.LAZY)
    private Set<Coaches> coachesSet;
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    @ManyToOne(fetch = FetchType.LAZY)
    private Users userId;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "registrationId", fetch = FetchType.LAZY)
    private Set<Players> playersSet;
    @OneToMany(mappedBy = "registrationId", fetch = FetchType.LAZY)
    private Set<Statuses> statusesSet;
    @OneToMany(mappedBy = "registrationId", fetch = FetchType.LAZY)
    private Set<Bills> billsSet;

    public Registrations() {
    }

    public Registrations(Integer id) {
        this.id = id;
    }

    public Registrations(Integer id, String email) {
        this.id = id;
        this.email = email;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }

    public String getClubName() {
        return clubName;
    }

    public void setClubName(String clubName) {
        this.clubName = clubName;
    }

    public String getNip() {
        return nip;
    }

    public void setNip(String nip) {
        this.nip = nip;
    }

    public String getStreetNo() {
        return streetNo;
    }

    public void setStreetNo(String streetNo) {
        this.streetNo = streetNo;
    }

    public String getZipCode() {
        return zipCode;
    }

    public void setZipCode(String zipCode) {
        this.zipCode = zipCode;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRegistratorName() {
        return registratorName;
    }

    public void setRegistratorName(String registratorName) {
        this.registratorName = registratorName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(BigDecimal totalPrice) {
        this.totalPrice = totalPrice;
    }

    public String getRegistrationType() {
        return registrationType;
    }

    public void setRegistrationType(String registrationType) {
        this.registrationType = registrationType;
    }

    public Set<Coaches> getCoachesSet() {
        return coachesSet;
    }

    public void setCoachesSet(Set<Coaches> coachesSet) {
        this.coachesSet = coachesSet;
    }

    public Users getUserId() {
        return userId;
    }

    public void setUserId(Users userId) {
        this.userId = userId;
    }

    public Set<Players> getPlayersSet() {
        return playersSet;
    }

    public void setPlayersSet(Set<Players> playersSet) {
        this.playersSet = playersSet;
    }

    public Set<Statuses> getStatusesSet() {
        return statusesSet;
    }

    public void setStatusesSet(Set<Statuses> statusesSet) {
        this.statusesSet = statusesSet;
    }

    public Set<Bills> getBillsSet() {
        return billsSet;
    }

    public void setBillsSet(Set<Bills> billsSet) {
        this.billsSet = billsSet;
    }


    @Override
    public int hashCode() {
        int hash = 0;
        hash += (id != null ? id.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof Registrations)) {
            return false;
        }
        Registrations other = (Registrations) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities.Registrations[ id=" + id + " ]";
    }

}
