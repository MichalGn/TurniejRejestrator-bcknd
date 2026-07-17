package pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities;

import jakarta.persistence.Basic;
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
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;
import java.io.Serializable;
import java.math.BigDecimal;

/**
 *
 * @author Michał Gnatowski
 * @date 25 wrz 2025
 * @email michal.gnatowski@atrop.pl
 */

@Entity
@Table(name = "coaches")
@NamedQueries({
    @NamedQuery(name = "Coaches.findAll", query = "SELECT c FROM Coaches c"),
    @NamedQuery(name = "Coaches.findById", query = "SELECT c FROM Coaches c WHERE c.id = :id"),
    @NamedQuery(name = "Coaches.findByFirstname", query = "SELECT c FROM Coaches c WHERE c.firstname = :firstname"),
    @NamedQuery(name = "Coaches.findByLastname", query = "SELECT c FROM Coaches c WHERE c.lastname = :lastname"),
    @NamedQuery(name = "Coaches.findByGender", query = "SELECT c FROM Coaches c WHERE c.gender = :gender"),
    @NamedQuery(name = "Coaches.findByNightFriSat", query = "SELECT c FROM Coaches c WHERE c.nightFriSat = :nightFriSat"),
    @NamedQuery(name = "Coaches.findByNightSatSun", query = "SELECT c FROM Coaches c WHERE c.nightSatSun = :nightSatSun"),
    @NamedQuery(name = "Coaches.findBySupperFri", query = "SELECT c FROM Coaches c WHERE c.supperFri = :supperFri"),
    @NamedQuery(name = "Coaches.findByDinnerSat", query = "SELECT c FROM Coaches c WHERE c.dinnerSat = :dinnerSat"),
    @NamedQuery(name = "Coaches.findBySupperSat", query = "SELECT c FROM Coaches c WHERE c.supperSat = :supperSat"),
    @NamedQuery(name = "Coaches.findByDinnerSun", query = "SELECT c FROM Coaches c WHERE c.dinnerSun = :dinnerSun"),
    @NamedQuery(name = "Coaches.findByPrice", query = "SELECT c FROM Coaches c WHERE c.price = :price")})
public class Coaches implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Size(max = 256)
    @Column(name = "firstname")
    private String firstname;
    @Size(max = 256)
    @Column(name = "lastname")
    private String lastname;
    @Size(max = 1)
    @Column(name = "gender")
    private String gender;
    @Column(name = "night_fri_sat")
    private Boolean nightFriSat;
    @Column(name = "night_sat_sun")
    private Boolean nightSatSun;
    @Column(name = "supper_fri")
    private Boolean supperFri;
    @Column(name = "dinner_sat")
    private Boolean dinnerSat;
    @Column(name = "supper_sat")
    private Boolean supperSat;
    @Column(name = "dinner_sun")
    private Boolean dinnerSun;
    // @Max(value=?)  @Min(value=?)//if you know range of your decimal fields consider using these annotations to enforce field validation
    @Column(name = "price")
    private BigDecimal price;
    @JoinColumn(name = "registration_id", referencedColumnName = "id")
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Registrations registrationId;

    public Coaches() {
    }

    public Coaches(Integer id) {
        this.id = id;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getFirstname() {
        return firstname;
    }

    public void setFirstname(String firstname) {
        this.firstname = firstname;
    }

    public String getLastname() {
        return lastname;
    }

    public void setLastname(String lastname) {
        this.lastname = lastname;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public Boolean getNightFriSat() {
        return nightFriSat;
    }

    public void setNightFriSat(Boolean nightFriSat) {
        this.nightFriSat = nightFriSat;
    }

    public Boolean getNightSatSun() {
        return nightSatSun;
    }

    public void setNightSatSun(Boolean nightSatSun) {
        this.nightSatSun = nightSatSun;
    }

    public Boolean getSupperFri() {
        return supperFri;
    }

    public void setSupperFri(Boolean supperFri) {
        this.supperFri = supperFri;
    }

    public Boolean getDinnerSat() {
        return dinnerSat;
    }

    public void setDinnerSat(Boolean dinnerSat) {
        this.dinnerSat = dinnerSat;
    }

    public Boolean getSupperSat() {
        return supperSat;
    }

    public void setSupperSat(Boolean supperSat) {
        this.supperSat = supperSat;
    }

    public Boolean getDinnerSun() {
        return dinnerSun;
    }

    public void setDinnerSun(Boolean dinnerSun) {
        this.dinnerSun = dinnerSun;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Registrations getRegistrationId() {
        return registrationId;
    }

    public void setRegistrationId(Registrations registrationId) {
        this.registrationId = registrationId;
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
        if (!(object instanceof Coaches)) {
            return false;
        }
        Coaches other = (Coaches) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities.Coaches[ id=" + id + " ]";
    }

}
